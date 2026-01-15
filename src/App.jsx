import { useState } from 'react';
import { ExecutionProvider, useExecution } from './lib/store';
import { IngestionPanel } from './components/IngestionPanel';
import { DecisionCard } from './components/DecisionCard';
import { ContractForm } from './components/ContractForm';
import { ExecutionFeed } from './components/ExecutionFeed';
import { AuditLogView } from './components/AuditLogView';

function Dashboard() {
  const { state, dispatch } = useExecution();
  const [activeDecision, setActiveDecision] = useState(null);

  const handleCreateContract = (decision) => {
    setActiveDecision(decision);
  };

  const handleContractSubmit = (contractData) => {
    dispatch({ type: 'CREATE_CONTRACT', payload: contractData });
    setActiveDecision(null);
  };

  const closeForm = () => {
    setActiveDecision(null);
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.05em' }}>
          KING OF <span style={{ color: 'var(--accent-primary)' }}>THE WORLD</span>
        </h1>
        <p className="text-muted">Absolute Execution Authority & Global Enforcement System</p>
      </header>

      <main className="grid grid-cols-2 gap-8">
        {/* Left Column: Ingestion & Decisions */}
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="section-title">1. INGESTION STREAM</h2>
            <IngestionPanel />
          </section>

          <section>
            <h2 className="section-title">2. DETECTED DECISIONS</h2>
            <div className="flex flex-col gap-4">
              {state.decisions.filter(d => d.status === 'detected').length === 0 && (
                <p className="text-muted text-sm">No pending decisions detected.</p>
              )}
              {state.decisions
                .filter(d => d.status === 'detected')
                .map(decision => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    onCreateContract={() => handleCreateContract(decision)}
                  />
                ))}
            </div>
          </section>
        </div>

        {/* Right Column: Execution Feed */}
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="section-title">3. EXECUTION FEED</h2>
            <ExecutionFeed />
          </section>
        </div>
      </main>

      {/* Governance Layer */}
      <AuditLogView />

      {/* Modal for Contract Creation */}
      {activeDecision && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', zIndex: 100
        }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <ContractForm
              decision={activeDecision}
              onCancel={closeForm}
              onSubmit={handleContractSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ExecutionProvider>
      <Dashboard />
    </ExecutionProvider>
  );
}
