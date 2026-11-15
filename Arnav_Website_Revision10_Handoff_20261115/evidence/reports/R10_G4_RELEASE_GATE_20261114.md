# G4 release reproduction - PASS

Two fresh release builds, identical source manifests, individually validated gates.

Build 1: LUT 39962, WNS +0.182 ns, WHS +0.007 ns; SHA256 2d59f7431a265452d90387538549ef1f4d93ff2381bb59a85d9b224c910768ef.

Build 2: LUT 39962, WNS +0.182 ns, WHS +0.007 ns; SHA256 bbc50b68dee4c0e2c3e04ed22e09bc0dffba83f342ad4386dd43c4788add2002.

Image timestamps can change bitstream hashes; no bitwise equivalence claim.
G5 GUI-copy test next. HARDWARE_VALIDATED=NO, SOC_INTEGRATION_COMPLETE=NO, FORMAL_PROOF=NO.

## Binary reproducibility verification (readback 14 Nov)

| Build | LUT | FF | WNS ns | WHS ns | Whole-file SHA256 |
|---|---:|---:|---:|---:|---|
| 1 |39962|29187|+0.182|+0.007|2d59f7431a265452d90387538549ef1f4d93ff2381bb59a85d9b224c910768ef|
| 2 |39962|29187|+0.182|+0.007|bbc50b68dee4c0e2c3e04ed22e09bc0dffba83f342ad4386dd43c4788add2002|

The two .bit files differ at 5 byte offsets, ALL inside the parsed header time field: 17:27:31 versus 18:42:24.
Their 3825788-byte configuration payloads are byte-identical; payload SHA256 54228bfc7b7536a48cb27e1538574199d7088fd4ff2f849664d141317204c3dd.
Design name, target part and header date also match. This establishes identical programmed configuration payload,
not identical complete .bit files. Full comparison evidence: R10_G4_BITSTREAM_COMPARISON_20261114.json.
