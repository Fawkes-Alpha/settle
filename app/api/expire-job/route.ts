import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { createPublicClient, http } from 'viem';
import { arcTestnet } from 'viem/chains';
import { NextResponse } from 'next/server';

const CONTRACT = '0x0747EEf0706327138c69792bF28Cd525089e4583';

const circle = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function POST(req: Request) {
  const { jobId } = await req.json();

  const tx = await circle.createContractExecutionTransaction({
    walletAddress: process.env.CLIENT_WALLET_ADDRESS!,
    blockchain: 'ARC-TESTNET',
    contractAddress: CONTRACT,
    abiFunctionSignature: 'expire(uint256,bytes)',
    abiParameters: [jobId, '0x'],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });

  let txHash = '';
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const result = await circle.getTransaction({ id: tx.data?.id! });
    const state = result.data?.transaction?.state;
    if (state === 'COMPLETE') {
      txHash = result.data?.transaction?.txHash!;
      break;
    }
    if (state === 'FAILED') return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  return NextResponse.json({ txHash });
}