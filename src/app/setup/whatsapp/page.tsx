'use client';

import React, { useState, useEffect, useRef } from 'react';

type WaStatus = 'open' | 'close' | 'connecting' | 'unknown';

export default function WhatsappSetupPage() {
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionToken, setEvolutionToken] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('groomy_whatsapp');
  
  const [waStatus, setWaStatus] = useState<WaStatus>('unknown');
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState('');
  const [waProfileName, setWaProfileName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load credentials from database on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.ok && data.config) {
          const url = data.config.evolution_api_url || '';
          const token = data.config.evolution_api_token || '';
          const inst = data.config.evolution_instance || 'groomy_whatsapp';
          
          setEvolutionUrl(url);
          setEvolutionToken(token);
          setEvolutionInstance(inst);
          
          if (url && token && inst) {
            checkStatus(url, token, inst);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações do banco:', err);
      }
    }
    loadConfig();
    return () => stopPolling();
  }, []);

  const checkStatus = async (url = evolutionUrl, token = evolutionToken, inst = evolutionInstance) => {
    if (!url || !token || !inst) return;
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/setup/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', evolution_url: url, evolution_token: token, evolution_instance: inst }),
      });
      const data = await res.json();
      if (data.ok) {
        const state = data.state as WaStatus;
        setWaStatus(state);
        if (state === 'open') {
          setWaQrCode(null);
          stopPolling();
          fetchInfo(url, token, inst);
        } else {
          setWaPhone('');
          setWaProfileName('');
        }
      } else {
        setWaStatus('unknown');
      }
    } catch (err) {
      setWaStatus('unknown');
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchInfo = async (url = evolutionUrl, token = evolutionToken, inst = evolutionInstance) => {
    try {
      const res = await fetch('/api/setup/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'info', evolution_url: url, evolution_token: token, evolution_instance: inst }),
      });
      const data = await res.json();
      if (data.ok) {
        setWaPhone(data.phone || '');
        setWaProfileName(data.profileName || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async () => {
    if (!evolutionUrl || !evolutionToken || !evolutionInstance) {
      alert('Por favor, preencha todos os campos antes de salvar.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: [
            { key: 'evolution_api_url', value: evolutionUrl, type: 'string', group: 'whatsapp', label: 'URL da Evolution API' },
            { key: 'evolution_api_token', value: evolutionToken, type: 'password', group: 'whatsapp', label: 'Token de Acesso (API Key)' },
            { key: 'evolution_instance', value: evolutionInstance, type: 'string', group: 'whatsapp', label: 'Nome da Instância' }
          ]
        })
      });
      const data = await res.json();
      if (data.ok) {
        alert('Configurações salvas no banco de dados!');
        checkStatus();
      } else {
        alert(data.error || 'Erro ao salvar configurações.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!evolutionUrl || !evolutionToken || !evolutionInstance) {
      alert('Por favor, preencha a URL, o Token e a Instância.');
      return;
    }

    setLoading(true);
    setWaQrCode(null);
    try {
      const res = await fetch('/api/setup/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qr', evolution_url: evolutionUrl, evolution_token: evolutionToken, evolution_instance: evolutionInstance }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.qrCode) {
          setWaQrCode(data.qrCode);
          setWaStatus('connecting');
          startPolling();
        } else {
          const state = (data.state as WaStatus) ?? 'open';
          setWaStatus(state);
          if (state === 'open') {
            fetchInfo();
            alert('WhatsApp já está conectado!');
          }
        }
      } else {
        alert(data.error || 'Erro ao gerar o QR Code.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o aparelho atual?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/setup/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', evolution_url: evolutionUrl, evolution_token: evolutionToken, evolution_instance: evolutionInstance }),
      });
      const data = await res.json();
      if (data.ok) {
        setWaStatus('close');
        setWaPhone('');
        setWaProfileName('');
        setWaQrCode(null);
        stopPolling();
        alert('WhatsApp desconectado com sucesso.');
      } else {
        alert(data.error || 'Erro ao desconectar.');
      }
    } catch (err) {
      alert('Erro de processamento.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/setup/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', evolution_url: evolutionUrl, evolution_token: evolutionToken, evolution_instance: evolutionInstance }),
        });
        const data = await res.json();
        if (data.ok && data.state === 'open') {
          setWaStatus('open');
          setWaQrCode(null);
          stopPolling();
          fetchInfo();
          alert('WhatsApp conectado com sucesso!');
        }
      } catch (err) {
        // Continue polling silently
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased relative pb-16 flex flex-col justify-center">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto px-6 py-12 w-full relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Mapeamento e Setup
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Instância WhatsApp
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Conecte o sistema à EvolutionAPI para enviar convites e notificações.
          </p>
        </div>

        {/* Card Panel */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
          
          <div className="space-y-4">
            {/* API URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">URL da Evolution API</label>
              <input
                type="text"
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value.trim().replace(/\/+$/, ''))}
                placeholder="https://evolution.seudominio.com.br"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
              />
            </div>

            {/* API Token */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Token de Acesso (API Key)</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={evolutionToken}
                  onChange={(e) => setEvolutionToken(e.target.value)}
                  placeholder="Seu Token Secreto"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showToken ? 'Ocultar' : 'Exibir'}
                </button>
              </div>
            </div>

            {/* Instance Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nome da Instância</label>
              <input
                type="text"
                value={evolutionInstance}
                onChange={(e) => setEvolutionInstance(e.target.value)}
                placeholder="Ex: groomy_whatsapp"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => checkStatus()}
              disabled={loadingStatus}
              className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all text-xs font-semibold text-slate-300 disabled:opacity-50"
            >
              {loadingStatus ? 'Verificando...' : 'Status'}
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="flex-1 px-3 py-2.5 bg-indigo-950 border border-indigo-900 hover:bg-indigo-900 hover:border-indigo-800 rounded-xl transition-all text-xs font-semibold text-indigo-300 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 px-3 py-2.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl transition-all text-xs font-semibold shadow-lg shadow-indigo-600/10 disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Conectar (QR)'}
            </button>
          </div>

          {/* Connection Info Area */}
          {waStatus === 'open' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-sm font-bold">WhatsApp Conectado</span>
              </div>
              <div className="text-center">
                {waProfileName && <p className="text-slate-200 font-semibold">{waProfileName}</p>}
                {waPhone && <p className="text-slate-400 font-mono text-xs mt-0.5">{waPhone}</p>}
              </div>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="mt-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
              >
                Desconectar Aparelho
              </button>
            </div>
          ) : waStatus === 'connecting' && waQrCode ? (
            <div className="flex flex-col items-center gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-300 text-center font-medium">
                Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código:
              </p>
              <div className="bg-white p-3.5 rounded-2xl shadow-xl flex justify-center items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={waQrCode} alt="WhatsApp QR Code" className="w-44 h-44 object-contain" />
              </div>
              <span className="text-xs text-amber-400 animate-pulse font-semibold">
                Aguardando leitura do QR Code...
              </span>
            </div>
          ) : (
            <div className="text-center py-2">
              {waStatus === 'close' && <p className="text-xs text-red-400 font-semibold">Instância desconectada ou inativa.</p>}
              {waStatus === 'unknown' && <p className="text-xs text-slate-500">Insira as credenciais e clique em Verificar.</p>}
            </div>
          )}

        </div>

      </div>

      {/* Discrete Support Label in Bottom Right */}
      <div className="fixed bottom-3 right-4 z-40 select-none pointer-events-none">
        <span className="text-[10px] font-mono text-slate-500/45 tracking-widest uppercase">
          FRM-WTP
        </span>
      </div>
    </div>
  );
}
