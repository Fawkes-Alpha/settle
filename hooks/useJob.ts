import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { arcTestnet } from "viem/chains";

const CONTRACT = "0x0747EEf0706327138c69792bF28Cd525089e4583" as const;

const abi = [
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "id", type: "uint256" },
        { name: "client", type: "address" },
        { name: "provider", type: "address" },
        { name: "evaluator", type: "address" },
        { name: "description", type: "string" },
        { name: "budget", type: "uint256" },
        { name: "expiredAt", type: "uint256" },
        { name: "status", type: "uint8" },
        { name: "hook", type: "address" },
      ],
    }],
  },
] as const;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export const STATUS_LABELS = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"];

export function useJob(jobId: bigint) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    client.readContract({
      address: CONTRACT,
      abi,
      functionName: "getJob",
      args: [jobId],
    })
    .then(setJob)
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
  }, [jobId]);

  return { job, loading, error };
}