import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Loader2, Users, Brain, Search } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { agentCouncilAPI } from '../api';

const TEMPLATE_OPTIONS = [
  { value: '', label: 'Gerar automaticamente (IA)' },
  { value: 'TI', label: 'TI — Arquiteto, Segurança, PM, DevOps, QA' },
  { value: 'DIREITO', label: 'Direito — Tributário, Trabalhista, Empresarial, Constitucional, Defesa' },
  { value: 'PETICAO', label: 'Petição — Redação, Jurisprudência, Contraditório, Revisão, Processual' },
];

export const Step2Build = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { sessionData, refreshSession } = useOutletContext();

  const [loading, setLoading] = useState(false);
  const [councilConfig, setCouncilConfig] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    // Check if council already exists in session data
    if (sessionData?.council_config) {
      setCouncilConfig(sessionData.council_config);
    }
  }, [sessionData]);

  const buildCouncil = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      const config = await agentCouncilAPI.buildCouncil(sessionId, force, selectedTemplate || null);

      if (config.error) {
        setError(config.error);
      } else {
        setCouncilConfig(config);
        await refreshSession();
      }
    } catch (err) {
      console.error('Build council error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to build council';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card>
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedTemplate ? `Carregando conselho de ${selectedTemplate}...` : 'Designing your council'}
            </h3>
            <p className="text-gray-600">
              {selectedTemplate
                ? 'Usando template pré-definido — sem chamada LLM.'
                : 'The Architect is analyzing your question and context files to propose a set of specialized agents...'}
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card>
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <Brain className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Failed to Build Council
              </h3>
              <p className="text-gray-600">{error}</p>
            </div>
            <div className="flex justify-center mt-6">
              <Button onClick={buildCouncil}>
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // No council yet — show template selector
  if (!councilConfig) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Card>
          <div className="py-8 px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Montar o Conselho</h2>
            <p className="text-gray-600 mb-6">Escolha um template pré-definido ou deixe a IA montar automaticamente.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conselho</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="mt-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded">
                  Template instantâneo — sem custo de LLM
                </p>
              )}
            </div>

            <Button onClick={() => buildCouncil(false)} disabled={loading}>
              {selectedTemplate ? `Usar template ${selectedTemplate}` : 'Gerar com IA'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {councilConfig?.council_name || 'Your Council'}
          </h2>
          <p className="text-gray-600">
            {councilConfig?.strategy_summary}
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              <Users className="h-4 w-4 mr-1" />
              {councilConfig?.agents?.length || 0} agents proposed
            </span>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Button
            variant="secondary"
            onClick={() => buildCouncil(true)}
            disabled={loading}
          >
            Rebuild (Force)
          </Button>
          <Button
            onClick={() => navigate(`/sessions/${sessionId}/edit`)}
            disabled={!councilConfig || loading}
          >
            Continue to Edit →
          </Button>
        </div>
      </div>
      
      {/* Agent Grid */}
      <div className="grid grid-cols-1 gap-8 mb-12">
        {councilConfig?.agents?.map((agent, index) => (
          <Card key={index}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {agent.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {agent.enable_web_search && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      <Search className="h-3 w-3 mr-1" />
                      Web Search
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.reasoning_effort === 'high'
                      ? 'bg-purple-100 text-purple-800'
                      : agent.reasoning_effort === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.reasoning_effort || 'medium'} reasoning
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="line-clamp-3">{agent.persona}</p>
                <button 
                  className="text-primary-600 hover:text-primary-700 text-xs mt-1"
                  onClick={() => {
                    // Could expand to show full persona
                  }}
                >
                  View full persona →
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
