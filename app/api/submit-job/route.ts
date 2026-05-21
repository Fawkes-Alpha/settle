import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { keccak256, toHex } from 'viem';
import { NextResponse } from 'next/server';

const CONTRACT = '0x0747EEf0706327138c69792bF28Cd525089e4583';

const circle = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

async function waitTx(id: string) {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const result = await circle.getTransaction({ id });
    const state = result.data?.transaction?.state;
    if (state === 'COMPLETE') return true;
    if (state === 'FAILED') return false;
  }
  return false;
}

export async function POST(req: Request) {
  const { jobId, deliverable } = await req.json();

  const deliverableHash = keccak256(toHex(deliverable));
  const tx = await circle.createContractExecutionTransaction({
    walletAddress: process.env.PROVIDER_WALLET_ADDRESS!,
    blockchain: 'ARC-TESTNET',
    contractAddress: CONTRACT,
    abiFunctionSignature: 'submit(uint256,bytes32,bytes)',
    abiParameters: [jobId, deliverableHash, '0x'],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  await waitTx(tx.data?.id!);

  return NextResponse.json({ success: true });
}