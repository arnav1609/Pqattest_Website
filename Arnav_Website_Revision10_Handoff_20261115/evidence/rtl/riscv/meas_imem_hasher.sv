`timescale 1ns/1ps
// M-F1 rev 10. 4096 little-endian words, 120 full rate blocks + 64-byte final block.
// Dedicated one-cycle IMEM port; no CPU stall. A new start synchronously aborts/restarts the sponge.
module meas_imem_hasher #(parameter logic [31:0] MEAS_BASE=32'h0)(
    input logic clk,rst,start_i,
    output logic meas_rd_en_o,
    output logic [31:0] meas_rd_addr_o,
    input logic [31:0] meas_rd_data_i,
    output logic [511:0] meas_imem_o,
    output logic [6:0] meas_imem_len_o,
    output logic meas_valid_o,busy_o
);
    typedef enum logic [2:0] {IDLE,CLEAR,FILL,PUSH,WAIT_BUSY,WAIT_HASH} state_t;
    state_t state;
    logic [12:0] word_next;
    logic [6:0] block_number;
    logic [5:0] issued,captured;
    logic pending;
    logic [1087:0] block_shift,sha_block;
    logic [255:0] sha_digest;
    logic sha_busy,sha_done,sha_rst_n;
    wire final_block=(block_number==7'd120);
    wire [5:0] block_words=final_block?6'd16:6'd34;

    assign meas_imem_len_o=7'd64;
    assign busy_o=(state!=IDLE);
    assign meas_rd_en_o=(state==FILL) && (issued<block_words) && !start_i && !rst;
    assign meas_rd_addr_o=MEAS_BASE+{17'd0,word_next,2'b00};
    // Fixed shifts, not a 1088-bit dynamically addressed write mux.
    assign sha_block=final_block?{576'd0,block_shift[1087:576]}:block_shift;
    assign sha_rst_n=!(rst || start_i || state==CLEAR);
    sha3_256 u_sha3(.clk,.rst_n(sha_rst_n),.start(state==PUSH),.msg_block_in(sha_block),
        .valid_bytes(final_block?8'd64:8'd136),.is_final(final_block),
        .digest(sha_digest),.busy(sha_busy),.done(sha_done));

    if(MEAS_BASE!=0)begin:g_invalid_base
        initial $fatal(1,"whole-IMEM profile requires MEAS_BASE=0");
    end
    always_ff @(posedge clk) begin
        if(rst)begin
            state<=IDLE;word_next<=0;block_number<=0;issued<=0;captured<=0;pending<=0;
            block_shift<=0;meas_imem_o<=0;meas_valid_o<=0;
        end else if(start_i)begin
            state<=CLEAR;word_next<=0;block_number<=0;issued<=0;captured<=0;pending<=0;
            block_shift<=0;meas_valid_o<=0;
        end else begin
            pending<=meas_rd_en_o;
            case(state)
                IDLE:begin end
                CLEAR:state<=FILL;
                FILL:begin
                    if(meas_rd_en_o)begin word_next<=word_next+1'b1;issued<=issued+1'b1;end
                    if(pending)begin
                        block_shift<={meas_rd_data_i,block_shift[1087:32]};
                        captured<=captured+1'b1;
                        if(captured==block_words-1'b1)state<=PUSH;
                    end
                end
                PUSH:state<=WAIT_BUSY;
                WAIT_BUSY:if(sha_busy)state<=WAIT_HASH;
                WAIT_HASH:if(!sha_busy)begin
                    if(final_block)begin
                        if(sha_done)begin
                            meas_imem_o<={192'd0,MEAS_BASE,32'd16384,sha_digest};
                            meas_valid_o<=1;state<=IDLE;
                        end
                    end else begin
                        block_number<=block_number+1'b1;issued<=0;captured<=0;
                        block_shift<=0;state<=FILL;
                    end
                end
                default:begin state<=IDLE;meas_valid_o<=0;end
            endcase
        end
    end
endmodule
