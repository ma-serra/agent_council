import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Key, Lightbulb } from 'lucide-react';
import { Card, Button } from '../components';
import { agentCouncilAPI } from '../api';

export const Settings = () => {
  const [settings, setSettings] = useState({
    openai_api_key: '',
    notion_token: '',
    google_drive_token: ''
  });

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [newSkill, setNewSkill] = useState({ name: '', description: '', prompt_template: '', is_active: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, skillsData] = await Promise.all([
        agentCouncilAPI.getSettings(),
        agentCouncilAPI.getSkills()
      ]);

      setSettings({
        openai_api_key: settingsData.openai_api_key || '',
        notion_token: settingsData.notion_token || '',
        google_drive_token: settingsData.google_drive_token || ''
      });
      setSkills(skillsData.skills || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load settings and skills.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setSaving(true);
      await agentCouncilAPI.updateSettings(settings);
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.description || !newSkill.prompt_template) {
      alert("Preencha todos os campos da skill.");
      return;
    }

    try {
      setSaving(true);
      await agentCouncilAPI.createSkill(newSkill);
      setNewSkill({ name: '', description: '', prompt_template: '', is_active: true });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar skill.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover esta skill?")) return;
    try {
      await agentCouncilAPI.deleteSkill(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erro ao remover skill.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Configurações & Skills</h2>
        <p className="text-gray-600">
          Personalize as integrações do James e do Conselho, e crie prompts customizados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Keys */}
        <div className="space-y-6">
          <Card title="Integrações & Chaves de API">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" /> OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openai_api_key}
                  onChange={e => setSettings({...settings, openai_api_key: e.target.value})}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notion Token (Opcional)</label>
                <input
                  type="password"
                  value={settings.notion_token}
                  onChange={e => setSettings({...settings, notion_token: e.target.value})}
                  placeholder="secret_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Token (Opcional)</label>
                <input
                  type="password"
                  value={settings.google_drive_token}
                  onChange={e => setSettings({...settings, google_drive_token: e.target.value})}
                  placeholder="ya29..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <Button onClick={handleSettingsSave} disabled={saving} className="w-full justify-center">
                <Save className="w-4 h-4 mr-2" /> Salvar Integrações
              </Button>
            </div>
          </Card>
        </div>

        {/* Skills */}
        <div className="space-y-6">
          <Card title="Banco de Skills & Prompts">
            <div className="space-y-6">

              {/* Add New Skill */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Nova Skill
                </h4>
                <input
                  type="text"
                  placeholder="Nome (ex: Especialista em Notion)"
                  value={newSkill.name}
                  onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="Descrição (ex: Busca notas no Notion do usuário)"
                  value={newSkill.description}
                  onChange={e => setNewSkill({...newSkill, description: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
                <textarea
                  placeholder="Prompt de sistema (instruções para o agente...)"
                  rows={3}
                  value={newSkill.prompt_template}
                  onChange={e => setNewSkill({...newSkill, prompt_template: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
                <Button onClick={handleAddSkill} disabled={saving} size="sm" className="w-full justify-center">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Skill
                </Button>
              </div>

              {/* List existing skills */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Suas Skills Ativas</h4>
                {skills.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma skill criada ainda.</p>
                ) : (
                  skills.map(skill => (
                    <div key={skill.id} className="flex flex-col p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <strong className="text-sm text-gray-900">{skill.name}</strong>
                        <button onClick={() => handleDeleteSkill(skill.id)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{skill.description}</p>
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded truncate" title={skill.prompt_template}>
                        {skill.prompt_template}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
