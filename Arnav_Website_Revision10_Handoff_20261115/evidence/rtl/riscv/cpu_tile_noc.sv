`timescale 1ns / 1ps
//=============================================================================
// cpu_tile_noc  --  the one CPU-tile module Lane 1 instantiates (brief v2 sec. B2, task R2.2). Lane 1, 2026-11-06.
//
// Contents: sync reset pipeline -> tile_top (PicoRV32 + adapter + addr_decode + UART + GPIO + STATUS B4)
//           + tile_mem_wrapper (IMEM with read port B, DMEM) + tmem_app_bridge (B1) + meas_window_reader (B3).
//
// Port list = cpu_tile_noc_stub (rtl/dual_lane/merged), so the merged core swaps by `define CPU_TILE_MODULE only.
// The stub's script parameters (ROUND_GAP, DATA_SEED, NEVER_AUTHORIZED_TEST, MEAS_IMAGE) are accepted and IGNORED
// here (the firmware does that work); they exist so the core's two instances elaborate unchanged.
//
// Decisions (VLSI review, autonomous session 2026-11-06):
//  - Reset: rst (synchronous, active high, from Lane 1) passes a synchronous 2-flop pipeline (A6; see below); every
//    block inside sees the same synchronised reset.
//  - A3 sideband: tmem_err_code_i = {1'b0, last_err_kind_o}. last_err_kind_o is registered on the same edge that
//    enters the bridge's error state, so it is valid in every cycle where tmem_err_o = 1 (checked in tb_cpu_tile_noc).
//  - Measurement trigger = the CPU's ATTEST_REQ pulse OR one pulse after reset release. The merged core holds the RoT
//    start until meas_valid_o, so the first measurement must not depend on firmware. The CPU cannot write IMEM
//    (R-D8), so the image read after reset is the image the CPU executes.
//  - gpio_o = {4'b0, leds}; switches tied to 0 (the board switches stay with Lane 1's top).
//=============================================================================
module cpu_tile_noc #(
    parameter int          TILE_ID          = 3,
    parameter int          MEM_TILE         = 2,
    parameter int          BRIDGE_TIMEOUT   = 4096,     // D7
    parameter int          NI_SLOT_TIMEOUT  = 8192,     // D6
    parameter logic [31:0] BUILD_ID         = 32'h0000_0000,
    parameter logic [31:0] MEAS_BASE        = 32'h0000_0000,
    // Legacy standalone profiles keep their window. The qualified rev-10 board explicitly selects full IMEM.
    parameter bit          WHOLE_IMEM_MEASUREMENT = 1'b0,
    parameter integer      IMEM_WORDS       = 4096,
    parameter integer      DMEM_WORDS       = 4096,
    parameter              IMEM_INIT_FILE   = "",
    parameter              DMEM_INIT_FILE   = "",
    // stub-compatibility parameters (ignored)
    parameter logic [31:0] ADDR             = 32'h2200_0100,
    parameter logic [31:0] DATA_SEED        = 32'h0,
    parameter int          ROUND_GAP        = 4096,
    parameter bit          NEVER_AUTHORIZED_TEST = 0,
    parameter logic [511:0] MEAS_IMAGE      = '0
)(
    input  logic clk, rst,
    // app TX (M-F1 rev 8 sec. 3)
    output logic                 app_valid_o,
    input  logic                 app_ready_i,
    output noc_pkg::coord_t      app_destination_o,
    output noc_pkg::msg_type_e   app_message_o,
    output logic [10:0]          app_control_o,
    output logic [31:0]          app_payload_o,
    output logic                 app_payload_valid_o,
    input  logic                 app_payload_ready_i,
    input  logic                 app_tx_error_i,
    // app_rx (sec. 4)
    input  logic                 app_rx_head_valid_i,
    input  noc_pkg::coord_t      app_rx_src_i,
    input  noc_pkg::msg_type_e   app_rx_msg_i,
    input  logic [10:0]          app_rx_control_i,
    input  logic [31:0]          app_rx_data_i,
    input  logic                 app_rx_data_valid_i,
    input  logic                 app_rx_last_i,
    input  logic                 app_rx_abort_i,
    // attestation
    input  logic                 authorized_i, grant_done_i, attest_failed_i,
    output logic                 attest_req_o,
    output logic [511:0]         meas_imem_o,
    output logic [6:0]           meas_imem_len_o,
    output logic                 meas_valid_o,
    // board
    output logic                 uart_tx_o,
    output logic [7:0]           gpio_o
);
    // ------------------------------------------------------------ reset (A6)
    // Synchronous 2-flop reset pipeline (Lane 1 2026-11-07, B7 DRC REQP-1839): rst is already synchronous to clk, so
    // reset_sync's ASYNC set (arst_i) only made the BRAM enable pins see an untimed asynchronous control. Assertion now
    // takes one edge, release stays two edges after rst falls; power-up value 2'b11 (FPGA register init) holds the tile in
    // reset until the first rst. rtl/riscv/reset_sync.sv is unchanged (other users).
    logic [1:0] rst_pipe_q = 2'b11;
    logic rst_s;
    always_ff @(posedge clk) rst_pipe_q <= rst ? 2'b11 : {rst_pipe_q[0], 1'b0};
    assign rst_s = rst_pipe_q[1];

    // ------------------------------------------------------------ tile
    logic        imem_valid, imem_ready, dmem_valid, dmem_ready;
    logic [31:0] imem_addr, imem_wdata, imem_rdata, dmem_addr, dmem_wdata, dmem_rdata;
    logic [3:0]  imem_wstrb, dmem_wstrb, leds;
    logic        tmem_req, tmem_we, tmem_is_fetch, tmem_gnt, tmem_rvalid, tmem_err;
    logic [31:0] tmem_addr, tmem_wdata, tmem_rdata;
    logic [3:0]  tmem_wstrb;
    logic [2:0]  last_err_kind;
    logic [15:0] timeout_count, refused_count;
    logic        attest_req;

    generate
        if (IMEM_WORDS != 4096 || DMEM_WORDS != 4096 || MEAS_BASE[1:0] != 0 || MEAS_BASE > 32'd16320) begin : g_bad_memory_profile
            $fatal(1,"cpu_tile_noc: supported profile is 16 KB memories and an aligned in-range 64-byte measurement window");
        end
    endgenerate

    tile_top #(.TILE_ID(4'(TILE_ID)), .BUILD_ID(BUILD_ID), .IMEM_WORDS(IMEM_WORDS), .DMEM_WORDS(DMEM_WORDS),
               .HAS_UART(1'b1)) u_tile (
        .clk_i(clk), .reset_i(rst_s),
        .imem_valid_o(imem_valid), .imem_addr_o(imem_addr), .imem_wdata_o(imem_wdata), .imem_wstrb_o(imem_wstrb),
        .imem_ready_i(imem_ready), .imem_rdata_i(imem_rdata),
        .dmem_valid_o(dmem_valid), .dmem_addr_o(dmem_addr), .dmem_wdata_o(dmem_wdata), .dmem_wstrb_o(dmem_wstrb),
        .dmem_ready_i(dmem_ready), .dmem_rdata_i(dmem_rdata),
        .uart_tx_o(uart_tx_o), .switches_i(4'b0), .leds_o(leds),
        .tmem_req_o(tmem_req), .tmem_we_o(tmem_we), .tmem_addr_o(tmem_addr), .tmem_wdata_o(tmem_wdata),
        .tmem_wstrb_o(tmem_wstrb), .tmem_is_fetch_o(tmem_is_fetch),
        .tmem_gnt_i(tmem_gnt), .tmem_rvalid_i(tmem_rvalid), .tmem_rdata_i(tmem_rdata), .tmem_err_i(tmem_err),
        .tmem_err_code_i({1'b0, last_err_kind}),
        .ni_timeout_count_i(timeout_count), .ni_refused_count_i(refused_count),
        .attested_i(authorized_i), .last_fault_timeout_i(1'b0), .attest_req_o(attest_req),
        .grant_done_i(grant_done_i), .attest_failed_i(attest_failed_i),
        .dbg_pc_o(), .dbg_inst_o(), .dbg_valid_o(), .dbg_trap_o());

    assign attest_req_o = attest_req;
    assign gpio_o       = {4'b0, leds};

    // ------------------------------------------------------------ memories (IMEM port B -> measurement reader)
    logic        meas_rd_en;
    logic [31:0] meas_rd_addr, meas_rd_data;

    tile_mem_wrapper #(.IMEM_WORDS(IMEM_WORDS), .DMEM_WORDS(DMEM_WORDS),
                       .IMEM_INIT_FILE(IMEM_INIT_FILE), .DMEM_INIT_FILE(DMEM_INIT_FILE)) u_mem (
        .clk_i(clk), .reset_i(rst_s),
        .imem_valid_i(imem_valid), .imem_addr_i(imem_addr), .imem_wdata_i(imem_wdata), .imem_wstrb_i(imem_wstrb),
        .imem_ready_o(imem_ready), .imem_rdata_o(imem_rdata),
        .dmem_valid_i(dmem_valid), .dmem_addr_i(dmem_addr), .dmem_wdata_i(dmem_wdata), .dmem_wstrb_i(dmem_wstrb),
        .dmem_ready_o(dmem_ready), .dmem_rdata_o(dmem_rdata),
        .meas_rd_en_i(meas_rd_en), .meas_rd_addr_i(meas_rd_addr), .meas_rd_data_o(meas_rd_data));

    // ------------------------------------------------------------ bridge (B1)
    tmem_app_bridge #(.TILE_ID(TILE_ID), .MEM_TILE(MEM_TILE), .BRIDGE_TIMEOUT(BRIDGE_TIMEOUT),
                      .NI_SLOT_TIMEOUT(NI_SLOT_TIMEOUT), .LATE_DRAIN_CYCLES(NI_SLOT_TIMEOUT)) u_bridge (
        .clk(clk), .rst(rst_s),
        .tmem_req_i(tmem_req), .tmem_we_i(tmem_we), .tmem_addr_i(tmem_addr), .tmem_wdata_i(tmem_wdata),
        .tmem_wstrb_i(tmem_wstrb), .tmem_is_fetch_i(tmem_is_fetch),
        .tmem_gnt_o(tmem_gnt), .tmem_rvalid_o(tmem_rvalid), .tmem_rdata_o(tmem_rdata), .tmem_err_o(tmem_err),
        .authorized_i(authorized_i),
        .app_valid_o, .app_ready_i, .app_destination_o, .app_message_o, .app_control_o, .app_payload_o,
        .app_payload_valid_o, .app_payload_ready_i, .app_tx_error_i,
        .app_rx_head_valid_i, .app_rx_src_i, .app_rx_msg_i, .app_rx_control_i, .app_rx_data_i,
        .app_rx_data_valid_i, .app_rx_last_i, .app_rx_abort_i,
        .last_err_kind_o(last_err_kind), .timeout_count_o(timeout_count), .refused_count_o(refused_count));

    // ------------------------------------------------------------ measurement trigger: ATTEST_REQ or once after reset
    logic boot_done_q, meas_start;
    always_ff @(posedge clk) begin
        if (rst_s) boot_done_q <= 1'b0;
        else       boot_done_q <= 1'b1;
    end
    assign meas_start = attest_req || (!rst_s && !boot_done_q);

    // ------------------------------------------------------------ measurement window reader (B3)
    generate if (WHOLE_IMEM_MEASUREMENT) begin:g_full
    if (IMEM_WORDS != 4096 || MEAS_BASE != 0) begin:g_invalid_full_profile
        initial $fatal(1,"whole-IMEM profile requires 4096 words and base zero");
    end
    meas_imem_hasher #(.MEAS_BASE(MEAS_BASE)) u_meas (
        .clk(clk), .rst(rst_s), .start_i(meas_start),
        .meas_rd_en_o(meas_rd_en), .meas_rd_addr_o(meas_rd_addr), .meas_rd_data_i(meas_rd_data),
        .meas_imem_o(meas_imem_o), .meas_imem_len_o(meas_imem_len_o), .meas_valid_o(meas_valid_o), .busy_o());
    end else begin:g_window
    meas_window_reader #(.MEAS_BASE(MEAS_BASE)) u_meas (
        .clk(clk), .rst(rst_s), .start_i(meas_start),
        .meas_rd_en_o(meas_rd_en), .meas_rd_addr_o(meas_rd_addr), .meas_rd_data_i(meas_rd_data),
        .meas_imem_o(meas_imem_o), .meas_imem_len_o(meas_imem_len_o), .meas_valid_o(meas_valid_o), .busy_o());
    end endgenerate

endmodule
