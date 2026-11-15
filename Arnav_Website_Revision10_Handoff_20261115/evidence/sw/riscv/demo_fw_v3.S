# Revision 10 whole-IMEM measurement demo; historical v2 is preserved.
# IRQ3 returns through retirq; grant wait bounded, button waits unbounded.
_start: j main
        .align_to 0x10
irq_vector: j handler
        .align_to 0x40
main:   li s0,0x10002000
        li s1,0x10000000
        li s2,0x10001000
        li s3,0x22000100
        li s5,0
        li s6,0
        li t0,-9
        .word 0x0602800B      # maskirq x0,x5 enables IRQ3
        lw t0,16(s0)
        li t1,3
        beq t0,t1,cpu_a
cpu_b:  li t3,0xB0B0B0B0
        sw t3,0(s3)
        lw t2,0(s3)
        li t0,0xBADBE002
        bne t2,t0,failed
        li t0,2
        bne s6,t0,failed
        bne s5,t0,failed
        la a0,refused
        call puts
        li t0,2
        sw t0,0(s2)
        j done
cpu_a:  li s4,1000000
wait_grant:
        lw t0,0(s0)
        andi t0,t0,2
        bnez t0,granted
        addi s4,s4,-1
        bnez s4,wait_grant
        j failed
granted:
        .word 0xC0002BF3      # rdcycle s7 start
        li t3,0xC0DE5A5A
        sw t3,0(s3)
        lw t2,0(s3)
        bne t2,t3,failed
        bnez s5,failed
        .word 0xC0002573      # rdcycle a0 stop
        sub a0,a0,s7
        li t1,0x4000
        sw a0,0(t1)          # cycles for defined write+read workload
        mv s7,a0
        la a0,admitted
        call puts
        mv a0,s7
        call puthex
        la a0,newline
        call puts
        li t0,1
        sw t0,0(s2)
wait_revoke:
        lw t0,0(s0)
        andi t0,t0,2
        beqz t0,revoked
        j wait_revoke
revoked:
        sw t3,0(s3)
        lw t2,0(s3)
        li t0,0xBADBE002
        bne t2,t0,failed
        li t0,2
        bne s6,t0,failed
        bne s5,t0,failed
        la a0,revoked_ok
        call puts
        li t0,5
        sw t0,0(s2)
        li t0,16
        sw t0,0(s0)          # clear sticky BUS_FAULT for recovery
        li s5,0
        li s6,0
wait_again:
        lw t0,0(s0)
        andi t0,t0,2
        bnez t0,recovered
        j wait_again
recovered:
        sw t3,0(s3)
        lw t2,0(s3)
        bne t2,t3,failed
        bnez s5,failed
        la a0,recovery_ok
        call puts
        li t0,7
        sw t0,0(s2)
done:   j done
failed: li t0,8
        sw t0,0(s2)
        la a0,fail_text
        call puts
        j done
# Handler uses only s5/s6; all application temporaries and return address survive.
handler: addi s5,s5,1
        lw s6,8(s0)
        .word 0x0400000B      # PicoRV32 retirq
puts:   lbu t0,0(a0)
        beqz t0,puts_end
        li t2,1000000
puts_wait:
        lw t1,4(s1)
        andi t1,t1,1
        beqz t1,puts_ready
        addi t2,t2,-1
        bnez t2,puts_wait
        li t0,8
        sw t0,0(s2)
        j done
puts_ready:
        sw t0,0(s1)
        addi a0,a0,1
        j puts
puts_end: ret
puthex: li a1,8
hex_loop:
        srli t0,a0,28
        li t1,10
        bltu t0,t1,hex_digit
        addi t0,t0,55
        j hex_ready
hex_digit: addi t0,t0,48
hex_ready:
        li t2,1000000
hex_wait:
        lw t1,4(s1)
        andi t1,t1,1
        beqz t1,hex_send
        addi t2,t2,-1
        bnez t2,hex_wait
        j done
hex_send:
        sw t0,0(s1)
        slli a0,a0,4
        addi a1,a1,-1
        bnez a1,hex_loop
        ret
admitted: .asciz "PASS T3 cycles="
refused: .asciz "PASS T0 REFUSED OK\n"
revoked_ok: .asciz "PASS T3 REVOKED\n"
recovery_ok: .asciz "PASS T3 RECOVERED\n"
fail_text: .asciz "FAIL CPU\n"
newline: .asciz "\n"
