`timescale 1ns / 1ps

module addr_decode (
input  logic        clk_i,
input  logic        reset_i,

// ------------------------------------------------------------
// Local request from picorv32_adapter
// ------------------------------------------------------------
input  logic        local_req_i,
input  logic        local_we_i,
input  logic [31:0] local_addr_i,
input  logic [31:0] local_wdata_i,
input  logic [3:0]  local_wstrb_i,
input  logic        local_is_fetch_i,

output logic        local_gnt_o,
output logic        local_rvalid_o,
output logic [31:0] local_rdata_o,
output logic        local_err_o,

// ------------------------------------------------------------
// Instruction memory
// ------------------------------------------------------------
output logic        imem_valid_o,
output logic [31:0] imem_addr_o,
output logic [31:0] imem_wdata_o,
output logic [3:0]  imem_wstrb_o,
input  logic        imem_ready_i,
input  logic [31:0] imem_rdata_i,

// ------------------------------------------------------------
// Data memory
// ------------------------------------------------------------
output logic        dmem_valid_o,
output logic [31:0] dmem_addr_o,
output logic [31:0] dmem_wdata_o,
output logic [3:0]  dmem_wstrb_o,
input  logic        dmem_ready_i,
input  logic [31:0] dmem_rdata_i,

// ------------------------------------------------------------
// UART
// ------------------------------------------------------------
output logic        uart_req_o,
output logic        uart_we_o,
output logic [31:0] uart_addr_o,
output logic [31:0] uart_wdata_o,
output logic [3:0]  uart_wstrb_o,
input  logic        uart_gnt_i,
input  logic        uart_rvalid_i,
input  logic [31:0] uart_rdata_i,
input  logic        uart_err_i,

// ------------------------------------------------------------
// GPIO
// ------------------------------------------------------------
output logic        gpio_req_o,
output logic        gpio_we_o,
output logic [31:0] gpio_addr_o,
output logic [31:0] gpio_wdata_o,
output logic [3:0]  gpio_wstrb_o,
input  logic        gpio_gnt_i,
input  logic        gpio_rvalid_i,
input  logic [31:0] gpio_rdata_i,
input  logic        gpio_err_i,

// ------------------------------------------------------------
// Tile status
// ------------------------------------------------------------
output logic        status_req_o,
output logic        status_we_o,
output logic [31:0] status_addr_o,
output logic [31:0] status_wdata_o,
output logic [3:0]  status_wstrb_o,
input  logic        status_gnt_i,
input  logic        status_rvalid_i,
input  logic [31:0] status_rdata_i,
input  logic        status_err_i,
output logic        ni_req_o,
output logic        ni_we_o,
output logic [31:0] ni_addr_o,
input  logic        ni_rvalid_i,
input  logic [31:0] ni_rdata_i,
input  logic        ni_err_i

);

// ------------------------------------------------------------
// Frozen local address map
// ------------------------------------------------------------

localparam logic [31:0] IMEM_BASE   = 32'h0000_0000;
localparam logic [31:0] IMEM_SIZE   = 32'h0000_4000;

localparam logic [31:0] DMEM_BASE   = 32'h0000_4000;
localparam logic [31:0] DMEM_SIZE   = 32'h0000_4000;

localparam logic [31:0] UART_BASE   = 32'h1000_0000;
localparam logic [31:0] UART_SIZE   = 32'h0000_1000;

localparam logic [31:0] GPIO_BASE   = 32'h1000_1000;
localparam logic [31:0] GPIO_SIZE   = 32'h0000_1000;

localparam logic [31:0] STATUS_BASE = 32'h1000_2000;
localparam logic [31:0] STATUS_SIZE = 32'h0000_1000;

typedef enum logic [2:0] {
    IDLE,
    IMEM_WAIT,
    DMEM_WAIT,
    UART_WAIT,
    GPIO_WAIT,
    STATUS_WAIT,
    NI_WAIT,
    ERR_RESP       // Lane 1 2026-11-06 (AD-4 / R-D8): error answered one cycle after the grant
} state_t;

state_t state_q, state_d;

logic [31:0] addr_q;
logic [31:0] wdata_q;
logic [3:0]  wstrb_q;
logic        we_q;

logic [31:0] rdata_q;
logic        err_q;

logic is_imem;
logic is_dmem;
logic is_uart;
logic is_gpio;
logic is_status;
logic is_ni;

// ------------------------------------------------------------
// Address decode
// ------------------------------------------------------------

always_comb begin
    is_imem =
        (local_addr_i >= IMEM_BASE) &&
        (local_addr_i <  IMEM_BASE + IMEM_SIZE);

    is_dmem =
        (local_addr_i >= DMEM_BASE) &&
        (local_addr_i <  DMEM_BASE + DMEM_SIZE);

    is_uart =
        (local_addr_i >= UART_BASE) &&
        (local_addr_i <  UART_BASE + UART_SIZE);

    is_gpio =
        (local_addr_i >= GPIO_BASE) &&
        (local_addr_i <  GPIO_BASE + GPIO_SIZE);

    is_status =
        (local_addr_i >= STATUS_BASE) &&
        (local_addr_i <  STATUS_BASE + STATUS_SIZE);
    is_ni = local_addr_i >= 32'h1000_3000 && local_addr_i < 32'h1000_4000;
end

// ------------------------------------------------------------
// Next-state logic and outputs
// ------------------------------------------------------------

always_comb begin
    state_d = state_q;

    local_gnt_o    = 1'b0;
    local_rvalid_o = 1'b0;
    local_rdata_o  = rdata_q;
    local_err_o    = err_q;

    imem_valid_o = 1'b0;
    imem_addr_o  = addr_q - IMEM_BASE;
    imem_wdata_o = wdata_q;
    imem_wstrb_o = wstrb_q;

    dmem_valid_o = 1'b0;
    dmem_addr_o  = addr_q - DMEM_BASE;
    dmem_wdata_o = wdata_q;
    dmem_wstrb_o = wstrb_q;

    uart_req_o   = 1'b0;
    uart_we_o    = we_q;
    uart_addr_o  = addr_q - UART_BASE;
    uart_wdata_o = wdata_q;
    uart_wstrb_o = wstrb_q;

    gpio_req_o   = 1'b0;
    gpio_we_o    = we_q;
    gpio_addr_o  = addr_q - GPIO_BASE;
    gpio_wdata_o = wdata_q;
    gpio_wstrb_o = wstrb_q;

    status_req_o   = 1'b0;
    status_we_o    = we_q;
    status_addr_o  = addr_q - STATUS_BASE;
    status_wdata_o = wdata_q;
    status_wstrb_o = wstrb_q;
    ni_req_o = 1'b0;
    ni_we_o = we_q;
    ni_addr_o = addr_q - 32'h1000_3000;

    case (state_q)

        IDLE: begin
            if (local_req_i) begin

                // Rev 10, approved 14 Nov: successful instruction fetches may target IMEM only.
                // Data accesses retain their existing target decoding and response timing.
                if (local_is_fetch_i && !is_imem) begin
                    local_gnt_o = 1'b1;
                    state_d = ERR_RESP;
                end
                else if (is_imem && local_we_i) begin
                    // R-D8 (Lane 1 2026-11-06): IMEM is read-only from the CPU data bus (protects the attested
                    // measurement window). The store never reaches the memory; it completes as a bus error.
                    local_gnt_o = 1'b1;
                    state_d     = ERR_RESP;
                end

                else if (is_imem) begin
                    // AD-1 (Lane 1 2026-11-06): mem_bram is a registered 1-cycle memory, so valid is asserted only
                    // in this accept cycle and the transaction always completes in IMEM_WAIT. The old same-cycle
                    // ready shortcut is removed: a stale ready there would have granted and never answered.
                    imem_valid_o = 1'b1;
                    imem_addr_o  = local_addr_i - IMEM_BASE;
                    imem_wdata_o = local_wdata_i;
                    imem_wstrb_o = local_wstrb_i;

                    local_gnt_o = 1'b1;
                    state_d     = IMEM_WAIT;
                end

                else if (is_dmem) begin
                    dmem_valid_o = 1'b1;
                    dmem_addr_o  = local_addr_i - DMEM_BASE;
                    dmem_wdata_o = local_wdata_i;
                    dmem_wstrb_o = local_wstrb_i;

                    local_gnt_o = 1'b1;
                    state_d     = DMEM_WAIT;   // AD-1: single access per transaction
                end

                else if (is_uart) begin
                    uart_req_o   = 1'b1;
                    uart_we_o    = local_we_i;
                    uart_addr_o  = local_addr_i - UART_BASE;
                    uart_wdata_o = local_wdata_i;
                    uart_wstrb_o = local_wstrb_i;

                    if (uart_gnt_i) begin
                        local_gnt_o = 1'b1;
                        state_d = UART_WAIT;
                    end
                end

                else if (is_gpio) begin
                    gpio_req_o   = 1'b1;
                    gpio_we_o    = local_we_i;
                    gpio_addr_o  = local_addr_i - GPIO_BASE;
                    gpio_wdata_o = local_wdata_i;
                    gpio_wstrb_o = local_wstrb_i;

                    if (gpio_gnt_i) begin
                        local_gnt_o = 1'b1;
                        state_d = GPIO_WAIT;
                    end
                end

                else if (is_status) begin
                    status_req_o   = 1'b1;
                    status_we_o    = local_we_i;
                    status_addr_o  = local_addr_i - STATUS_BASE;
                    status_wdata_o = local_wdata_i;
                    status_wstrb_o = local_wstrb_i;

                    if (status_gnt_i) begin
                        local_gnt_o = 1'b1;
                        state_d = STATUS_WAIT;
                    end
                end

                else if (is_ni) begin
                    ni_req_o = 1'b1;
                    ni_we_o = local_we_i;
                    ni_addr_o = local_addr_i - 32'h1000_3000;
                    local_gnt_o = 1'b1;
                    state_d = NI_WAIT;
                end
                else begin
                    // Unmapped local access. AD-4 (Lane 1 2026-11-06): the response used to come in the grant
                    // cycle, which the adapter never samples (it waits for rvalid after the grant), so the CPU
                    // hung. Now answered one cycle later in ERR_RESP, like every other target.
                    local_gnt_o = 1'b1;
                    state_d     = ERR_RESP;
                end
            end
        end

        IMEM_WAIT: begin
            imem_addr_o  = addr_q - IMEM_BASE;   // AD-1: no second access (valid stays 0)

            if (imem_ready_i) begin
                local_rvalid_o = 1'b1;
                local_rdata_o  = imem_rdata_i;
                local_err_o    = 1'b0;
                state_d        = IDLE;
            end
        end

        DMEM_WAIT: begin
            dmem_addr_o  = addr_q - DMEM_BASE;   // AD-1: no second access (valid stays 0)

            if (dmem_ready_i) begin
                local_rvalid_o = 1'b1;
                local_rdata_o  = dmem_rdata_i;
                local_err_o    = 1'b0;
                state_d        = IDLE;
            end
        end

        UART_WAIT: begin
            if (uart_rvalid_i) begin
                local_rvalid_o = 1'b1;
                local_rdata_o  = uart_rdata_i;
                local_err_o    = uart_err_i;
                state_d        = IDLE;
            end
        end

        GPIO_WAIT: begin
            if (gpio_rvalid_i) begin
                local_rvalid_o = 1'b1;
                local_rdata_o  = gpio_rdata_i;
                local_err_o    = gpio_err_i;
                state_d        = IDLE;
            end
        end

        STATUS_WAIT: begin
            if (status_rvalid_i) begin
                local_rvalid_o = 1'b1;
                local_rdata_o  = status_rdata_i;
                local_err_o    = status_err_i;
                state_d        = IDLE;
            end
        end

        NI_WAIT: begin
            if (ni_rvalid_i) begin
                local_rvalid_o = 1'b1;
                local_rdata_o = ni_rdata_i;
                local_err_o = ni_err_i;
                state_d = IDLE;
            end
        end

        ERR_RESP: begin
            local_rvalid_o = 1'b1;
            local_rdata_o  = 32'b0;
            local_err_o    = 1'b1;
            state_d        = IDLE;
        end

        default: begin
            state_d = IDLE;
        end

    endcase
end

// ------------------------------------------------------------
// Transaction registers
// ------------------------------------------------------------

always_ff @(posedge clk_i) begin   // Lane 1 2026-11-06 (A6): synchronous reset
    if (reset_i) begin
        state_q <= IDLE;

        addr_q  <= 32'b0;
        wdata_q <= 32'b0;
        wstrb_q <= 4'b0;
        we_q    <= 1'b0;

        rdata_q <= 32'b0;
        err_q   <= 1'b0;
    end
    else begin
        state_q <= state_d;

        if (state_q == IDLE && local_req_i) begin
            addr_q  <= local_addr_i;
            wdata_q <= local_wdata_i;
            wstrb_q <= local_wstrb_i;
            we_q    <= local_we_i;
        end

        if (state_q == IMEM_WAIT && imem_ready_i) begin
            rdata_q <= imem_rdata_i;
            err_q   <= 1'b0;
        end

        else if (state_q == DMEM_WAIT && dmem_ready_i) begin
            rdata_q <= dmem_rdata_i;
            err_q   <= 1'b0;
        end

        else if (state_q == UART_WAIT && uart_rvalid_i) begin
            rdata_q <= uart_rdata_i;
            err_q   <= uart_err_i;
        end

        else if (state_q == GPIO_WAIT && gpio_rvalid_i) begin
            rdata_q <= gpio_rdata_i;
            err_q   <= gpio_err_i;
        end

        else if (state_q == STATUS_WAIT && status_rvalid_i) begin
            rdata_q <= status_rdata_i;
            err_q   <= status_err_i;
        end
    end
end

endmodule
