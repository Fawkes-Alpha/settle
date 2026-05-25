'use client';
import { useState, useEffect } from 'react';

type Step = 'idle' | 'creating' | 'funding' | 'submitting' | 'confirming' | 'done' | 'revision';

export default function Home() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('5');
  const [jobId, setJobId] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [txHash, setTxHash] = useState('');
  const [deliverable, setDeliverable] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [revisionCount, setRevisionCount] = useState(0);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const fundingSteps = [
    'Step 1/3 — Setting budget',
    'Step 2/3 — Approving USDC',
    'Step 3/3 — Funding escrow',
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const t1 = setTimeout(() => setLoadingStep(1), 10000);
    const t2 = setTimeout(() => setLoadingStep(2), 20000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  const handleCreateJob = async () => {
    if (!description) return;
    setLoading(true);
    addLog('Creating job on blockchain...');
    const res = await fetch('/api/create-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    const data = await res.json();
    setJobId(data.jobId);
    setTxHash(data.txHash);
    addLog(`Job #${data.jobId} created successfully`);
    setLoading(false);
    setStep('funding');
  };

  const handleFundJob = async () => {
    setLoading(true);
    setLoadingStep(0);
    addLog(`Locking ${amount} USDC into escrow...`);
    await fetch('/api/fund-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, amount }),
    });
    addLog(`${amount} USDC locked in smart contract`);
    setLoading(false);
    setStep('submitting');
  };

  const handleSubmitWork = async () => {
    if (!deliverable) return;
    setLoading(true);
    addLog(revisionCount > 0 ? 'Provider resubmitting revised work...' : 'Provider submitting work...');
    await fetch('/api/submit-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, deliverable }),
    });
    addLog('Work submitted — waiting for client confirmation');
    setLoading(false);
    setStep('confirming');
  };

  const handleConfirm = async () => {
    setLoading(true);
    addLog('Client confirming work...');
    await fetch('/api/complete-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    addLog(`${amount} USDC released to provider`);
    setLoading(false);
    setStep('done');
  };

  const handleDispute = async () => {
    if (!disputeReason) return;
    setLoading(true);
    addLog('Client raised a dispute...');
    await fetch('/api/dispute-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, reason: disputeReason }),
    });
    addLog(`Dispute reason: "${disputeReason}"`);
    addLog('Job sent back to provider for revision...');
    setLoading(false);
    setShowDisputeForm(false);
    setRevisionCount(prev => prev + 1);
    setDeliverable('');
    setStep('revision');
  };

  const reset = () => {
    setStep('idle'); setLog([]); setJobId('');
    setTxHash(''); setDescription(''); setDeliverable('');
    setDisputeReason(''); setShowDisputeForm(false);
    setRevisionCount(0);
  };

  const progress = { idle:0, creating:20, funding:40, submitting:60, confirming:80, done:100, revision:60 }[step];

  const Spinner = () => (
    <span style={{display:'inline-block',width:'14px',height:'14px',border:'2px solid rgba(245,197,66,0.3)',borderTopColor:'#f5c542',borderRadius:'50%',animation:'spin 0.8s linear infinite',marginRight:'8px',verticalAlign:'middle'}}/>
  );

  const Dots = () => (
    <><span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dot{0%,80%,100%{opacity:0}40%{opacity:1}}
        .dot{animation:dot 1.2s infinite;opacity:0}
        .dot:nth-child(2){animation-delay:0.2s}
        .dot:nth-child(3){animation-delay:0.4s}
        .upload-zone:hover{border-color:#f5c542 !important;background:#0f0f1a !important}
        .remove-btn:hover{color:#f0eeea !important}
        .dispute-btn:hover{background:rgba(239,68,68,0.15) !important}
      `}</style>
      <main style={{minHeight:'100vh',background:'#0a0a0f',color:'#f0eeea',fontFamily:'system-ui,sans-serif'}}>

        <div style={{borderBottom:'1px solid #1e1e2e',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'32px',height:'32px',background:'#f5c542',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>⚖️</div>
            <span style={{fontWeight:'800',fontSize:'18px',letterSpacing:'-0.5px'}}>Settle</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#13131a',border:'1px solid #1e1e2e',borderRadius:'8px',padding:'6px 12px'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#4ade80'}}></div>
            <span style={{fontSize:'12px',color:'#6b6b7a'}}>Arc Testnet</span>
          </div>
        </div>

        <div style={{maxWidth:'480px',margin:'0 auto',padding:'40px 20px'}}>

          <div style={{textAlign:'center',marginBottom:'40px'}}>
            <h1 style={{fontSize:'32px',fontWeight:'800',letterSpacing:'-1px',marginBottom:'8px',lineHeight:'1.2'}}>
              Work done.<br/>
              <span style={{color:'#f5c542'}}>Payment guaranteed.</span>
            </h1>
            <p style={{color:'#6b6b7a',fontSize:'15px',lineHeight:'1.6'}}>
              Lock USDC in a smart contract · Release on completion · Powered by Arc
            </p>
          </div>

          {step !== 'idle' && (
            <div style={{marginBottom:'24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                {['Create','Fund','Submit','Confirm','Done'].map((s,i) => (
                  <span key={i} style={{fontSize:'11px',color:progress>=(i+1)*20?'#f5c542':'#6b6b7a',fontWeight:'600'}}>{s}</span>
                ))}
              </div>
              <div style={{background:'#1e1e2e',borderRadius:'100px',height:'4px'}}>
                <div style={{background:step==='revision'?'#f97316':'#f5c542',height:'4px',borderRadius:'100px',width:`${progress}%`,transition:'width 0.5s ease'}}></div>
              </div>
            </div>
          )}

          <div style={{background:'#13131a',border:`1px solid ${step==='revision'?'rgba(249,115,22,0.3)':'#1e1e2e'}`,borderRadius:'20px',padding:'28px',marginBottom:'16px'}}>

            {step === 'idle' && (
              <>
                <div style={{marginBottom:'20px'}}>
                  <label style={{fontSize:'12px',color:'#6b6b7a',fontWeight:'600',letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:'8px'}}>Job Description</label>
                  <textarea
                    style={{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:'10px',padding:'12px 16px',color:'#f0eeea',fontSize:'15px',outline:'none',boxSizing:'border-box',resize:'vertical',minHeight:'120px',fontFamily:'system-ui,sans-serif'}}
                    placeholder="Describe the job in detail — deliverables, deadline, requirements..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div style={{marginBottom:'24px'}}>
                  <label style={{fontSize:'12px',color:'#6b6b7a',fontWeight:'600',letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:'8px'}}>Amount (USDC)</label>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'10px'}}>
                    {['1','5','10','20'].map(v => (
                      <button key={v} onClick={() => setAmount(v)}
                        style={{padding:'10px',borderRadius:'8px',border:`1px solid ${amount===v?'#f5c542':'#1e1e2e'}`,background:amount===v?'rgba(245,197,66,0.1)':'#0a0a0f',color:amount===v?'#f5c542':'#6b6b7a',fontWeight:'700',cursor:'pointer',fontSize:'14px'}}>
                        ${v}
                      </button>
                    ))}
                  </div>
                  <input
                    style={{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:'10px',padding:'12px 16px',color:'#f0eeea',fontSize:'15px',outline:'none',boxSizing:'border-box'}}
                    type="number" placeholder="Or enter custom amount..." value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <button onClick={handleCreateJob} disabled={!description||loading}
                  style={{width:'100%',padding:'16px',background:'#f5c542',border:'none',borderRadius:'12px',fontWeight:'800',fontSize:'16px',color:'#0a0a0f',cursor:'pointer',opacity:!description?0.4:1}}>
                  {loading ? <><Spinner/>Creating job<Dots/></> : 'Create Job & Lock USDC →'}
                </button>
              </>
            )}

            {step === 'funding' && (
              <>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                  <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#60a5fa',fontWeight:'600'}}>Job #{jobId}</div>
                  <div style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#4ade80',fontWeight:'600'}}>✓ Created</div>
                </div>
                <p style={{color:'#6b6b7a',marginBottom:'4px',fontSize:'13px'}}>Description</p>
                <p style={{fontWeight:'600',marginBottom:'20px',fontSize:'15px'}}>{description}</p>
                <div style={{background:'#0a0a0f',borderRadius:'12px',padding:'16px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#6b6b7a',fontSize:'14px'}}>Amount to lock</span>
                  <span style={{fontWeight:'800',fontSize:'20px',color:'#f5c542'}}>{amount} USDC</span>
                </div>
                {loading && (
                  <div style={{marginBottom:'16px'}}>
                    <div style={{background:'#0a0a0f',borderRadius:'100px',height:'3px',marginBottom:'8px'}}>
                      <div style={{background:'#f5c542',height:'3px',borderRadius:'100px',width:`${(loadingStep+1)*33}%`,transition:'width 0.5s ease'}}></div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      {['Set budget','Approve','Fund'].map((s,i) => (
                        <span key={i} style={{fontSize:'10px',color:loadingStep>=i?'#f5c542':'#3a3a4a',fontWeight:'600'}}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={handleFundJob} disabled={loading}
                  style={{width:'100%',padding:'16px',background:loading?'#2a2a1a':'#f5c542',border:loading?'1px solid #f5c542':'none',borderRadius:'12px',fontWeight:'800',fontSize:'15px',color:loading?'#f5c542':'#0a0a0f',cursor:loading?'not-allowed':'pointer'}}>
                  {loading ? <><Spinner/>{fundingSteps[loadingStep]}<Dots/></> : '🔒 Lock USDC into Escrow'}
                </button>
              </>
            )}

            {(step === 'submitting' || step === 'revision') && (
              <>
                <div style={{display:'flex',gap:'8px',marginBottom:'20px',flexWrap:'wrap'}}>
                  <div style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#4ade80',fontWeight:'600'}}>Job #{jobId}</div>
                  <div style={{background:'rgba(245,197,66,0.1)',border:'1px solid rgba(245,197,66,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#f5c542',fontWeight:'600'}}>🔒 Funded</div>
                  {step === 'revision' && (
                    <div style={{background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#f97316',fontWeight:'600'}}>🔄 Revision #{revisionCount}</div>
                  )}
                </div>

                {step === 'revision' && disputeReason && (
                  <div style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.3)',borderRadius:'12px',padding:'14px 16px',marginBottom:'20px'}}>
                    <p style={{fontSize:'11px',color:'#f97316',fontWeight:'700',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>⚠️ Client Feedback</p>
                    <p style={{fontSize:'13px',color:'#fed7aa',lineHeight:'1.5'}}>{disputeReason}</p>
                  </div>
                )}

                <div style={{background:'rgba(245,197,66,0.05)',border:'1px solid rgba(245,197,66,0.2)',borderRadius:'12px',padding:'12px 16px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#6b6b7a',fontSize:'13px'}}>Locked in escrow</span>
                  <span style={{fontWeight:'800',fontSize:'18px',color:'#f5c542'}}>{amount} USDC</span>
                </div>

                <div style={{background:step==='revision'?'rgba(249,115,22,0.05)':'rgba(96,165,250,0.05)',border:`1px solid ${step==='revision'?'rgba(249,115,22,0.2)':'rgba(96,165,250,0.2)'}`,borderRadius:'10px',padding:'10px 14px',marginBottom:'20px'}}>
                  <span style={{fontSize:'12px',color:step==='revision'?'#f97316':'#60a5fa',fontWeight:'600'}}>
                    {step==='revision' ? '🔄 PROVIDER — Please revise and resubmit' : '👷 PROVIDER ACTION REQUIRED'}
                  </span>
                </div>

                <label style={{fontSize:'12px',color:'#6b6b7a',fontWeight:'600',letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:'8px'}}>
                  {step==='revision' ? 'Revised Deliverable' : 'Deliverable'}
                </label>
                {!deliverable.startsWith('📎') && (
                  <label className="upload-zone" style={{display:'block',background:'#0a0a0f',border:'2px dashed #2e2e4e',borderRadius:'10px',padding:'24px',textAlign:'center',cursor:'pointer',marginBottom:'12px',transition:'all 0.2s'}}>
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
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <span style={{fontSize:'20px'}}>📎</span>
                      <span style={{fontSize:'13px',color:'#4ade80',fontWeight:'600'}}>{deliverable.replace('📎 ','')}</span>
                    </div>
                    <button onClick={() => setDeliverable('')} className="remove-btn"
                      style={{background:'rgba(255,255,255,0.05)',border:'1px solid #2e2e3e',borderRadius:'6px',color:'#6b6b7a',fontWeight:'800',fontSize:'16px',width:'28px',height:'28px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'}}>
                      ×
                    </button>
                  </div>
                )}
                {!deliverable.startsWith('📎') && (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                      <div style={{flex:1,height:'1px',background:'#1e1e2e'}}></div>
                      <span style={{fontSize:'11px',color:'#3a3a4a'}}>or add a link / description</span>
                      <div style={{flex:1,height:'1px',background:'#1e1e2e'}}></div>
                    </div>
                    <textarea
                      style={{width:'100%',background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:'10px',padding:'12px 16px',color:'#f0eeea',fontSize:'15px',outline:'none',boxSizing:'border-box',resize:'vertical',minHeight:'80px',fontFamily:'system-ui,sans-serif',marginBottom:'16px'}}
                      placeholder="Paste Google Drive link, Figma link, or describe what was completed..."
                      value={deliverable}
                      onChange={e => setDeliverable(e.target.value)}
                    />
                  </>
                )}
                {deliverable.startsWith('📎') && <div style={{marginBottom:'16px'}}/>}
                <button onClick={handleSubmitWork} disabled={!deliverable||loading}
                  style={{width:'100%',padding:'16px',background:loading?'#2a2a1a':step==='revision'?'#f97316':'#60a5fa',border:loading?`1px solid ${step==='revision'?'#f97316':'#60a5fa'}`:'none',borderRadius:'12px',fontWeight:'800',fontSize:'15px',color:loading?step==='revision'?'#f97316':'#60a5fa':'#0a0a0f',cursor:!deliverable||loading?'not-allowed':'pointer',opacity:!deliverable?0.4:1}}>
                  {loading ? <><Spinner/>Submitting work<Dots/></> : step==='revision' ? '🔄 Resubmit Revised Work' : '📦 Submit Work'}
                </button>
              </>
            )}

            {step === 'confirming' && (
              <>
                <div style={{display:'flex',gap:'8px',marginBottom:'20px',flexWrap:'wrap'}}>
                  <div style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#4ade80',fontWeight:'600'}}>Job #{jobId}</div>
                  <div style={{background:'rgba(96,165,250,0.1)',border:'1px solid rgba(96,165,250,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#60a5fa',fontWeight:'600'}}>📦 Submitted</div>
                  {revisionCount > 0 && (
                    <div style={{background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'#f97316',fontWeight:'600'}}>🔄 Revision #{revisionCount}</div>
                  )}
                </div>
                <div style={{background:'rgba(74,222,128,0.05)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'20px'}}>
                  <span style={{fontSize:'12px',color:'#4ade80',fontWeight:'600'}}>✅ CLIENT ACTION REQUIRED</span>
                </div>
                <p style={{color:'#6b6b7a',fontSize:'13px',marginBottom:'4px'}}>Deliverable submitted</p>
                <p style={{fontWeight:'600',fontSize:'14px',marginBottom:'20px',color:'#c0bbb4',lineHeight:'1.5'}}>{deliverable}</p>
                <div style={{background:'rgba(245,197,66,0.05)',border:'1px solid rgba(245,197,66,0.2)',borderRadius:'12px',padding:'16px',marginBottom:'24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'#6b6b7a',fontSize:'14px'}}>Ready to release</span>
                  <span style={{fontWeight:'800',fontSize:'20px',color:'#f5c542'}}>{amount} USDC</span>
                </div>
                <p style={{color:'#6b6b7a',fontSize:'13px',marginBottom:'16px',lineHeight:'1.6'}}>Review the deliverable above. If satisfied, confirm to release payment.</p>

                <button onClick={handleConfirm} disabled={loading||showDisputeForm}
                  style={{width:'100%',padding:'16px',background:loading?'#1a2a1a':'#4ade80',border:loading?'1px solid #4ade80':'none',borderRadius:'12px',fontWeight:'800',fontSize:'15px',color:loading?'#4ade80':'#0a0a0f',cursor:loading||showDisputeForm?'not-allowed':'pointer',opacity:showDisputeForm?0.4:1,marginBottom:'10px'}}>
                  {loading ? <><Spinner/>Releasing payment<Dots/></> : '✅ Confirm & Release Payment'}
                </button>

                {!showDisputeForm && (
                  <button onClick={() => setShowDisputeForm(true)} disabled={loading}
                    className="dispute-btn"
                    style={{width:'100%',padding:'12px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',fontWeight:'700',fontSize:'14px',color:'#ef4444',cursor:'pointer',transition:'all 0.2s'}}>
                    ⚠️ Raise Dispute
                  </button>
                )}

                {showDisputeForm && (
                  <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',padding:'16px',marginTop:'4px'}}>
                    <p style={{fontSize:'13px',color:'#ef4444',fontWeight:'600',marginBottom:'10px'}}>⚠️ Describe the issue for provider to fix</p>
                    <textarea
                      style={{width:'100%',background:'#0a0a0f',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',padding:'10px 14px',color:'#f0eeea',fontSize:'14px',outline:'none',boxSizing:'border-box',resize:'vertical',minHeight:'80px',fontFamily:'system-ui,sans-serif',marginBottom:'10px'}}
                      placeholder="e.g. Work quality does not match requirements, wrong deliverable..."
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                    />
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      <button onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }}
                        style={{padding:'10px',background:'#1e1e2e',border:'1px solid #2e2e3e',borderRadius:'8px',color:'#6b6b7a',fontWeight:'600',cursor:'pointer',fontSize:'13px'}}>
                        Cancel
                      </button>
                      <button onClick={handleDispute} disabled={!disputeReason||loading}
                        style={{padding:'10px',background:!disputeReason?'#2a1a1a':'#ef4444',border:'none',borderRadius:'8px',color:!disputeReason?'#ef4444':'#fff',fontWeight:'700',cursor:!disputeReason?'not-allowed':'pointer',fontSize:'13px',opacity:!disputeReason?0.5:1}}>
                        {loading ? <><Spinner/>Processing<Dots/></> : 'Send for Revision'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 'done' && (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:'48px',marginBottom:'16px'}}>🎉</div>
                <h2 style={{fontSize:'22px',fontWeight:'800',marginBottom:'8px'}}>Payment Complete!</h2>
                <p style={{color:'#6b6b7a',marginBottom:'24px'}}>{amount} USDC successfully released to provider</p>
                {revisionCount > 0 && (
                  <p style={{fontSize:'12px',color:'#f97316',marginBottom:'16px'}}>Completed after {revisionCount} revision{revisionCount>1?'s':''}</p>
                )}
                {txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank"
                    style={{display:'block',background:'rgba(245,197,66,0.1)',border:'1px solid rgba(245,197,66,0.3)',borderRadius:'10px',padding:'12px',color:'#f5c542',textDecoration:'none',fontSize:'13px',marginBottom:'16px'}}>
                    View transaction on Arc Explorer →
                  </a>
                )}
                <button onClick={reset}
                  style={{padding:'12px 32px',background:'#1e1e2e',border:'1px solid #2e2e3e',borderRadius:'10px',color:'#f0eeea',fontWeight:'600',cursor:'pointer',fontSize:'14px'}}>
                  Create New Job
                </button>
              </div>
            )}

          </div>

          {log.length > 0 && (
            <div style={{background:'#13131a',border:'1px solid #1e1e2e',borderRadius:'16px',padding:'20px'}}>
              <p style={{fontSize:'11px',color:'#6b6b7a',fontWeight:'600',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'12px'}}>Activity Log</p>
              {log.map((entry, i) => (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'8px'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#4ade80',marginTop:'5px',flexShrink:0}}></div>
                  <span style={{fontSize:'13px',color:'#c0bbb4',lineHeight:'1.5'}}>{entry}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}