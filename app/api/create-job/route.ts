import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { createPublicClient, http, decodeEventLog } from 'viem';
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
  const { description } = await req.json();

  const now = await publicClient.getBlock();
  const expiredAt = now.timestamp + 86400n;

  const tx = await circle.createContractExecutionTransaction({
    walletAddress: process.env.CLIENT_WALLET_ADDRESS!,
    blockchain: 'ARC-TESTNET',
    contractAddress: CONTRACT,
    abiFunctionSignature: 'createJob(address,address,uint256,string,address)',
    abiParameters: [
      process.env.PROVIDER_WALLET_ADDRESS!,
      process.env.CLIENT_WALLET_ADDRESS!,
      expiredAt.toString(),
      description,
      '0x0000000000000000000000000000000000000000',
    ],
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

  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
  const abi = [{
    type: 'event', name: 'JobCreated',
    inputs: [
      { indexed: true, name: 'jobId', type: 'uint256' },
      { indexed: true, name: 'client', type: 'address' },
      { indexed: true, name: 'provider', type: 'address' },
      { indexed: false, name: 'evaluator', type: 'address' },
      { indexed: false, name: 'expiredAt', type: 'uint256' },
      { indexed: false, name: 'hook', type: 'address' },
    ],
    anonymous: false,
  }] as const;

  let jobId = '';
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics });
      if (decoded.eventName === 'JobCreated') jobId = decoded.args.jobId.toString();
    } catch {}
  }

  return NextResponse.json({ jobId, txHash, expiredAt: expiredAt.toString() });
}