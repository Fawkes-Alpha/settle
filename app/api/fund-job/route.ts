import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { parseUnits } from 'viem';
import { NextResponse } from 'next/server';

const CONTRACT = '0x0747EEf0706327138c69792bF28Cd525089e4583';
const USDC = '0x3600000000000000000000000000000000000000';

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
  const { jobId, amount } = await req.json();
  const BUDGET = parseUnits(amount, 6).toString();

  // setBudget
  const tx1 = await circle.createContractExecutionTransaction({
    walletAddress: process.env.PROVIDER_WALLET_ADDRESS!,
    blockchain: 'ARC-TESTNET',
    contractAddress: CONTRACT,
    abiFunctionSignature: 'setBudget(uint256,uint256,bytes)',
    abiParameters: [jobId, BUDGET, '0x'],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  await waitTx(tx1.data?.id!);

  // approve
  const tx2 = await circle.createContractExecutionTransaction({
    walletAddress: process.env.CLIENT_WALLET_ADDRESS!,
    blockchain: 'ARC-TESTNET',
    contractAddress: USDC,
    abiFunctionSignature: 'approve(address,uint256)',
    abiParameters: [CONTRACT, BUDGET],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  await waitTx(tx2.data?.id!);

  // fund
  const tx3 = await circle.createContractExecutionTransaction({
    walletAddress: process.env.CLIENT_WALLET_ADDRESS!,
    blockchain: 'ARC-TESTNET',
    contractAddress: CONTRACT,
    abiFunctionSignature: 'fund(uint256,bytes)',
    abiParameters: [jobId, '0x'],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  await waitTx(tx3.data?.id!);

  return NextResponse.json({ success: true, jobId });
}