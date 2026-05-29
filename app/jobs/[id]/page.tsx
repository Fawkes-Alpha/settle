'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createPublicClient, http, formatUnits } from 'viem';
import { arcTestnet } from 'viem/chains';
import { JobCountdown } from '../../../components/JobCountdown';

const CONTRACT = '0x0747EEf0706327138c69792bF28Cd525089e4583' as const;

const abi = [{
  type: 'function',
  name: 'getJob',
  stateMutability: 'view',
  inputs: [{ name: 'jobId', type: 'uint256' }],
  outputs: [{
    type: 'tuple',
    components: [
      { name: 'id', type: 'uint256' },
      { name: 'client', type: 'address' },
      { name: 'provider', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'budget', type: 'uint256' },
      { name: 'expiredAt', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'hook', type: 'address' },
    ],
  }],
}] as const;

const STATUS_LABELS = ['Open', 'Funded', 'Submitted', 'Completed', 'Rejected', 'Expired'];
const STATUS_COLORS: Record<number, string> = {
  0: '#60a5fa', 1: '#f5c542', 2: '#a78bfa',
  3: '#4ade80', 4: '#ef4444', 5: '#6b6b7a',
};

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export default function JobPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    publicClient.readContract({
      address: CONTRACT,
      abi,
      functionName: 'getJob',
      args: [BigInt(jobId)],
    })
    .then(setJob)
    .catch(() => setError('Job not found or invalid ID.'))
    .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) setAddress(accounts[0]);
    });
    eth.on('accountsChanged', (accounts: string[]) => {
      setAddress(accounts[0] || '');
    });
  }, []);

  const connectWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('MetaMask not found! Please install MetaMask.');
      return;
    }
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
    } catch (err) {
      console.error('Connection rejected', err);
    }
  };

  const disconnectWallet = () => setAddress('');

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitWork = async () => {
    if (!deliverable) return;
    setSubmitting(true);
    await fetch('/api/submit-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, deliverable }),
    });
    setSubmitting(false);
    setSubmitDone(true);
  };

  if (loading) return (
    <main style={{minHeight:'100vh',background:'#0a0a0f',color:'#f0eeea',fontFamily:'system-ui,sans-serif',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'#6b6b7a'}}>Loading job #{jobId}...</p>
    </main>
  );

  if (error) return (
    <main style={{minHeight:'100vh',background:'#0a0a0f',color:'#f0eeea',fontFamily:'system-ui,sans-serif',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'#ef4444'}}>{error}</p>
    </main>
  );

  const status = Number(job.status);
  const budget = formatUnits(job.budget, 6);
  const isConnected = !!address;
  const isProvider = isConnected && address.toLowerCase() === job.provider.toLowerCase();
  const isClient = isConnected && address.toLowerCase() === job.client.toLowerCase();

  return (
    <main style={{minHeight:'100vh',background:'#0a0a0f',color:'#f0eeea',fontFamily:'system-ui,sans-serif'}}>

      <div style={{borderBottom:'1px solid #1e1e2e',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'#f5c542',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>⚡</div>
          <span style={{fontWeight:'800',fontSize:'18px',letterSpacing:'-0.5px',color:'#f0eeea'}}>Settle</span>
        </a>
        <div>
          {isConnected ? (
            <button onClick={disconnectWallet}
              style={{padding:'8px 14px',background:'#13131a',border:'1px solid #1e1e2e',borderRadius:'8px',color:'#6b6b7a',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
              {address.slice(0,6)}...{address.slice(-4)} ✕
            </button>
          ) : (
            <button onClick={connectWallet}
              style={{padding:'8px 14px',background:'#f5c542',border:'none',borderRadius:'8px',color:'#0a0a0f',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>
              🦊 Connect MetaMask
            </button>
          )}
        </div>
      </div>

      <div style={{maxWidth:'560px',margin:'0 auto',padding:'40px 20px'}}>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#60a5fa',fontWeight:'600'}}>
              Job #{jobId}
            </div>
            <div style={{borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:STATUS_COLORS[status],fontWeight:'600',background:`${STATUS_COLORS[status]}20`,border:`1px solid ${STATUS_COLORS[status]}40`}}>
              {STATUS_LABELS[status]}
            </div>
          </div>
          <button onClick={copyLink}
            style={{padding:'8px 14px',background:copied?'rgba(74,222,128,0.1)':'#13131a',border:`1px solid ${copied?'rgba(74,222,128,0.3)':'#1e1e2e'}`,borderRadius:'8px',color:copied?'#4ade80':'#6b6b7a',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
            {copied ? '✓ Copied!' : '🔗 Copy Link'}
          </button>
        </div>

        <div style={{background:'#13131a',border:'1px solid #1e1e2e',borderRadius:'20px',padding:'28px',marginBottom:'16px'}}>

          <h2 style={{fontSize:'20px',fontWeight:'700',marginBottom:'20px',lineHeight:'1.4'}}>{job.description}</h2>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'20px'}}>
            <div style={{background:'#0a0a0f',borderRadius:'12px',padding:'16px'}}>
              <p style={{fontSize:'11px',color:'#6b6b7a',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'1px'}}>Budget</p>
              <p style={{fontSize:'20px',fontWeight:'800',color:'#f5c542',margin:0}}>{budget} USDC</p>
            </div>
            <div style={{background:'#0a0a0f',borderRadius:'12px',padding:'16px'}}>
              <p style={{fontSize:'11px',color:'#6b6b7a',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'1px'}}>Status</p>
              <p style={{fontSize:'16px',fontWeight:'700',color:STATUS_COLORS[status],margin:0}}>{STATUS_LABELS[status]}</p>
            </div>
          </div>

          {job.expiredAt > 0n && status < 3 && (
            <div style={{marginBottom:'20px',padding:'16px',background:'#0a0a0f',borderRadius:'12px',border:'1px solid #1e1e2e'}}>
              <p style={{fontSize:'12px',color:'#6b6b7a',marginBottom:'8px'}}>⏳ Time remaining</p>
              <JobCountdown expiredAt={job.expiredAt} />
            </div>
          )}

          <div style={{borderTop:'1px solid #1e1e2e',paddingTop:'20px',marginBottom:'20px'}}>
            <p style={{fontSize:'11px',color:'#6b6b7a',marginBottom:'12px',textTransform:'uppercase',letterSpacing:'1px'}}>Parties</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12px',color:'#6b6b7a'}}>Client</span>
                <span style={{fontSize:'12px',fontFamily:'monospace',color:isClient?'#4ade80':'#f0eeea'}}>
                  {job.client.slice(0,6)}...{job.client.slice(-4)} {isClient && '(you)'}
                </span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12px',color:'#6b6b7a'}}>Provider</span>
                <span style={{fontSize:'12px',fontFamily:'monospace',color:isProvider?'#60a5fa':'#f0eeea'}}>
                  {job.provider.slice(0,6)}...{job.provider.slice(-4)} {isProvider && '(you)'}
                </span>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div style={{background:'rgba(245,197,66,0.05)',border:'1px solid rgba(245,197,66,0.2)',borderRadius:'12px',padding:'16px',marginBottom:'16px',textAlign:'center'}}>
              <p style={{fontSize:'13px',color:'#6b6b7a',marginBottom:'12px'}}>Connect your wallet to take action on this job</p>
              <button onClick={connectWallet}
                style={{padding:'12px 24px',background:'#f5c542',border:'none',borderRadius:'10px',color:'#0a0a0f',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>
                🦊 Connect MetaMask
              </button>
            </div>
          )}

          {isProvider && status === 1 && !submitDone && (
            <div style={{borderTop:'1px solid #1e1e2e',paddingTop:'20px'}}>
              <div style={{background:'rgba(96,165,250,0.05)',border:'1px solid rgba(96,165,250,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'16px'}}>
                <span style={{fontSize:'12px',color:'#60a5fa',fontWeight:'600'}}>📤 PROVIDER ACTION REQUIRED</span>
              </div>
              <label style={{fontSize:'12px',color:'#6b6b7a',fontWeight:'600',letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:'8px'}}>Deliverable</label>
              {!deliverable.startsWith('📎') && (
                <label style={{display:'block',background:'#0a0a0f',border:'2px dashed #2e2e4e',borderRadius:'10px',padding:'24px',textAlign:'center',cursor:'pointer',marginBottom:'12px'}}>
                  <input type="file" style={{display:'none'}} onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setDeliverable(`📎 ${file.name}`);
                  }}/>
                  <div style={{fontSize:'28px',marginBottom:'8px'}}>📁</div>
                  <div style={{fontSize:'13px',color:'#6b6b7a',fontWeight:'600'}}>Click to upload file</div>
                  <div style={{fontSize:'11px',color:'#3a3a4a',marginTop:'4px'}}>PNG, JPG, PDF, ZIP, AI, Figma...</div>
                </label>
              )}
              {deliverable.startsWith('📎') && (
                <div style={{background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'10px',padding:'12px 16px',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'13px',color:'#4ade80',fontWeight:'600'}}>{deliverable}</span>
                  <button onClick={() => setDeliverable('')}
                    style={{background:'none',border:'none',color:'#6b6b7a',fontSize:'16px',cursor:'pointer'}}>×</button>
                </div>
              )}
              {!deliverable.startsWith('📎') && (
                <textarea
                  style={{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:'10px',padding:'12px 16px',color:'#f0eeea',fontSize:'15px',outline:'none',boxSizing:'border-box',resize:'vertical',minHeight:'80px',fontFamily:'system-ui,sans-serif',marginBottom:'16px'}}
                  placeholder="Paste Google Drive link, Figma link, or describe what was completed..."
                  value={deliverable}
                  onChange={e => setDeliverable(e.target.value)}
                />
              )}
              {deliverable.startsWith('📎') && <div style={{marginBottom:'16px'}}/>}
              <button onClick={handleSubmitWork} disabled={!deliverable||submitting}
                style={{width:'100%',padding:'16px',background:submitting?'#2a2a1a':'#60a5fa',border:'none',borderRadius:'12px',fontWeight:'800',fontSize:'15px',color:submitting?'#60a5fa':'#0a0a0f',cursor:!deliverable||submitting?'not-allowed':'pointer',opacity:!deliverable?0.4:1}}>
                {submitting ? 'Submitting...' : '📤 Submit Work'}
              </button>
            </div>
          )}

          {isProvider && status === 1 && submitDone && (
            <div style={{borderTop:'1px solid #1e1e2e',paddingTop:'20px',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>✅</div>
              <p style={{fontWeight:'700',color:'#4ade80',marginBottom:'4px'}}>Work submitted!</p>
              <p style={{fontSize:'13px',color:'#6b6b7a'}}>Waiting for client to confirm and release payment.</p>
            </div>
          )}

          {isClient && status === 2 && (
            <div style={{borderTop:'1px solid #1e1e2e',paddingTop:'20px',textAlign:'center'}}>
              <div style={{background:'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'16px'}}>
                <span style={{fontSize:'12px',color:'#4ade80',fontWeight:'600'}}>✅ CLIENT ACTION REQUIRED</span>
              </div>
              <p style={{fontSize:'13px',color:'#6b6b7a'}}>Provider has submitted work. Go to the main app to confirm and release payment.</p>
              <a href="/" style={{display:'block',marginTop:'12px',padding:'12px',background:'#f5c542',borderRadius:'10px',color:'#0a0a0f',fontWeight:'700',textDecoration:'none',fontSize:'14px'}}>
                Go to Settle App →
              </a>
            </div>
          )}

          {!isProvider && !isClient && isConnected && (
            <div style={{borderTop:'1px solid #1e1e2e',paddingTop:'20px',textAlign:'center'}}>
              <p style={{fontSize:'13px',color:'#6b6b7a'}}>Your wallet is not a party in this job.</p>
            </div>
          )}

          <div style={{borderTop:'1px solid #1e1e2e',paddingTop:'20px',marginTop:'20px'}}>
            <a href={`https://testnet.arcscan.app/address/${CONTRACT}`} target="_blank"
              style={{display:'block',textAlign:'center',background:'rgba(245,197,66,0.05)',border:'1px solid rgba(245,197,66,0.2)',borderRadius:'10px',padding:'12px',color:'#f5c542',textDecoration:'none',fontSize:'13px'}}>
              View contract on Arc Explorer ↗
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}