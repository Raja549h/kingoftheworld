import { createContext, useContext, useReducer } from 'react';
import { predictFailure } from './failure_engine';

const initialState = {
  // TENANT ISOLATION
  tenantId: 'pilot-tenant-001',
  pilotMode: 'GA_CONSTRAINED', // GENERAL AVAILABILITY (Constrained)

  decisions: [],
  contracts: [],
  // Graph Data: Agents with Trust Scores
  agents: [
    { name: 'John', role: 'Engineering', trustScore: 0.9, history: [] },
    { name: 'Alice', role: 'Product', trustScore: 0.85, history: [] },
    { name: 'Bob', role: 'Design', trustScore: 0.6, history: [] },
  ],
  // Governance & Audit
  auditLog: [],
  systemConfig: {
    disablePredictions: false,
    disableAutoEscalation: false, // ENABLED
    readOnlyMode: false,
    enableNudges: true,
  },
  currentUser: { id: 'admin-1', name: 'Admin User', role: 'ADMIN' },

  // OBSERVABILITY METRICS
  metrics: {
    executionLift: 0, // % improvement
    alertFatigue: 0, // % dismissed
    overrideFreq: 0, // % overrides
    trustDrift: 0, // avg score change
  },

  // PILOT BASELINE
  baselineMetrics: {
    avgDecisionsPerMeeting: 0,
    taskCompletionRate: 0,
    avgTimeToClose: 0,
    setAt: null,
  }
};

const ExecutionContext = createContext(initialState);

function logEvent(state, eventType, target, payload, reason = null) {
  const event = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    tenantId: state.tenantId, // Tenant Isolation in Logs
    eventType,
    actor: { id: state.currentUser.id, role: state.currentUser.role },
    target,
    payload,
    reason,
  };
  return [...state.auditLog, event];
}

function executionReducer(state, action) {
  // KILL-SWITCH & ADVISORY MODE CHECKS
  if (state.systemConfig.readOnlyMode && !['TOGGLE_SYSTEM_CONFIG', 'EXPORT_DATA'].includes(action.type)) {
    console.warn("Action blocked: System is in READ-ONLY mode.");
    return state;
  }

  switch (action.type) {
    case 'SET_BASELINE_METRICS':
      if (state.currentUser.role !== 'ADMIN') return state;
      return {
        ...state,
        baselineMetrics: { ...action.payload, setAt: new Date().toISOString() },
        auditLog: logEvent(state, 'BASELINE_SET', { type: 'SYSTEM', id: 'baseline' }, action.payload),
      };

    case 'ADD_DECISIONS':
      return {
        ...state,
        decisions: [...state.decisions, ...action.payload],
        auditLog: logEvent(state, 'DECISION_DETECTED', { type: 'SYSTEM', id: 'batch' }, { count: action.payload.length }),
      };

    case 'CREATE_CONTRACT':
      const newContract = {
        id: crypto.randomUUID(),
        tenantId: state.tenantId, // Tenant Tagging
        status: 'open',
        logs: [{ date: new Date().toISOString(), message: 'Contract created' }],
        ...action.payload,
      };

      // Link contract to agent if exists
      const agentIndex = state.agents.findIndex(a => a.name === action.payload.owner);
      let updatedAgents = state.agents;

      if (agentIndex === -1 && action.payload.owner) {
        // New agent discovered
        updatedAgents = [...state.agents, { name: action.payload.owner, role: 'Unknown', trustScore: 0.5, history: [] }];
      }

      return {
        ...state,
        contracts: [newContract, ...state.contracts],
        decisions: state.decisions.map(d =>
          d.id === action.payload.decisionId ? { ...d, status: 'contracted' } : d
        ),
        agents: updatedAgents,
        auditLog: logEvent(state, 'CONTRACT_CREATED', { type: 'CONTRACT', id: newContract.id }, newContract),
      };

    case 'UPDATE_CONTRACT_STATUS':
      // GA LOGIC: Constrained Enforcement
      if (action.payload.isAuto) {
        // Auto-Escalation Logic
        if (state.pilotMode === 'GA_CONSTRAINED' && action.payload.status === 'ESCALATED') {
          const contract = state.contracts.find(c => c.id === action.payload.id);
          const agent = state.agents.find(a => a.name === contract?.owner);
          const prediction = predictFailure(contract, agent);

          // GATED ESCALATION: High Risk OR Medium Risk
          // Low Risk is SUPPRESSED (Safe Harbor)
          const isEscalatable = prediction.isHighRisk || prediction.riskLevel === 'MEDIUM';

          if (!isEscalatable) {
            console.log("Auto-escalation suppressed: Low Risk Item (GA Safe Harbor)");
            return state;
          }
        }
      } else {
        // MANUAL OVERRIDE SAFEGUARD
        // If user is de-escalating (ESCALATED -> OPEN/COMPLETED), require reason
        const currentContract = state.contracts.find(c => c.id === action.payload.id);
        if (currentContract?.status === 'ESCALATED' && action.payload.status !== 'ESCALATED') {
          if (!action.payload.reason || action.payload.reason.length < 5) {
            console.warn("Override blocked: Mandatory justification missing.");
            return state;
          }
        }
      }

      return {
        ...state,
        contracts: state.contracts.map(c =>
          c.id === action.payload.id
            ? { ...c, status: action.payload.status, logs: [...c.logs, { date: new Date().toISOString(), message: 'Proof submitted & verified' }] }
            : c
        ),
        auditLog: logEvent(state, 'STATUS_CHANGE', { type: 'CONTRACT', id: action.payload.id }, { status: action.payload.status, reason: action.payload.reason || 'Manual Update' }),
      };

    case 'ADD_PROOF':
      // Update Trust Score on Completion
      const completedContract = state.contracts.find(c => c.id === action.payload.id);
      const ownerName = completedContract?.owner;

      const newAgents = state.agents.map(agent => {
        if (agent.name === ownerName) {
          // CALIBRATED LOGIC
          // 1. Momentum Bonus
          const newStreak = (agent.successStreak || 0) + 1;
          let bonus = 0;
          if (newStreak >= 3 && agent.trustScore < 0.6) {
            bonus = 0.02;
          }

          const newScore = Math.min(1.0, agent.trustScore + 0.05 + bonus);
          return { ...agent, trustScore: newScore, successStreak: newStreak };
        }
        return agent;
      });

      return {
        ...state,
        contracts: state.contracts.map(c =>
          c.id === action.payload.id
            ? { ...c, proof: action.payload.proof, status: 'completed', logs: [...c.logs, { date: new Date().toISOString(), message: 'Proof submitted & verified' }] }
            : c
        ),
        agents: newAgents,
        auditLog: logEvent(state, 'PROOF_SUBMITTED', { type: 'CONTRACT', id: action.payload.id }, { proof: action.payload.proof }),
      };

    case 'TOGGLE_SYSTEM_CONFIG':
      if (state.currentUser.role !== 'ADMIN') return state;
      return {
        ...state,
        systemConfig: {
          ...state.systemConfig,
          [action.payload.key]: !state.systemConfig[action.payload.key]
        },
        auditLog: logEvent(state, 'CONFIG_CHANGE', { type: 'SYSTEM', id: 'config' }, { key: action.payload.key, newValue: !state.systemConfig[action.payload.key] }),
      };

    // ROLLBACK & EXPORT ACTIONS
    case 'RESET_SYSTEM': // Soft Reset
      if (state.currentUser.role !== 'ADMIN') return state;
      return {
        ...initialState,
        tenantId: state.tenantId, // Keep Tenant
        currentUser: state.currentUser, // Keep User
        auditLog: logEvent(state, 'SYSTEM_RESET', { type: 'SYSTEM', id: 'reset' }, { type: 'SOFT' }),
      };

    case 'EXPORT_DATA':
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
      // In a real app, we'd trigger a download. For now, we just log it.
      console.log("Exporting Data:", state);
      return {
        ...state,
        auditLog: logEvent(state, 'DATA_EXPORT', { type: 'SYSTEM', id: 'export' }, { timestamp: Date.now() })
      };

    default:
      return state;
  }
}

export function ExecutionProvider({ children }) {
  const [state, dispatch] = useReducer(executionReducer, initialState);

  return (
    <ExecutionContext.Provider value={{ state, dispatch }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  return useContext(ExecutionContext);
}
