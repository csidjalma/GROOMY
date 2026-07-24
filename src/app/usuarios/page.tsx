'use client';

import React, { useEffect, useState, startTransition } from 'react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, Usuario } from './actions';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [expira, setExpira] = useState(false);
  const [dataExpira, setDataExpira] = useState('');
  const [periodo, setPeriodo] = useState<number>(30);
  
  // Permissions us_menu1 to us_menu20
  const [menus, setMenus] = useState<boolean[]>(Array(20).fill(false));

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setNome('');
    setLogin('');
    setSenha('');
    setExpira(false);
    setDataExpira('');
    setPeriodo(30);
    setMenus(Array(20).fill(false));
    setShowModal(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setEditingId(user.id);
    setNome(user.us_nome);
    setLogin(user.us_login);
    setSenha(user.us_senha);
    setExpira(!!user.us_expira);
    setDataExpira(user.us_data ? user.us_data.substring(0, 10) : '');
    setPeriodo(user.us_periodo || 30);
    
    const userMenus = [
      !!user.us_menu1, !!user.us_menu2, !!user.us_menu3, !!user.us_menu4, !!user.us_menu5,
      !!user.us_menu6, !!user.us_menu7, !!user.us_menu8, !!user.us_menu9, !!user.us_menu10,
      !!user.us_menu11, !!user.us_menu12, !!user.us_menu13, !!user.us_menu14, !!user.us_menu15,
      !!user.us_menu16, !!user.us_menu17, !!user.us_menu18, !!user.us_menu19, !!user.us_menu20
    ];
    setMenus(userMenus);
    setShowModal(true);
  };

  const handleToggleMenu = (index: number) => {
    const updated = [...menus];
    updated[index] = !updated[index];
    setMenus(updated);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      const res = await deleteUsuario(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || 'Erro ao excluir usuário');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !login || !senha) {
      alert('Por favor, preencha os campos obrigatórios (Nome, Login, Senha)');
      return;
    }

    const payload = {
      us_nome: nome,
      us_login: login,
      us_senha: senha,
      us_expira: expira ? 1 : 0,
      us_data: dataExpira || null,
      us_periodo: periodo,
      us_menu1: menus[0] ? 1 : 0,
      us_menu2: menus[1] ? 1 : 0,
      us_menu3: menus[2] ? 1 : 0,
      us_menu4: menus[3] ? 1 : 0,
      us_menu5: menus[4] ? 1 : 0,
      us_menu6: menus[5] ? 1 : 0,
      us_menu7: menus[6] ? 1 : 0,
      us_menu8: menus[7] ? 1 : 0,
      us_menu9: menus[8] ? 1 : 0,
      us_menu10: menus[9] ? 1 : 0,
      us_menu11: menus[10] ? 1 : 0,
      us_menu12: menus[11] ? 1 : 0,
      us_menu13: menus[12] ? 1 : 0,
      us_menu14: menus[13] ? 1 : 0,
      us_menu15: menus[14] ? 1 : 0,
      us_menu16: menus[15] ? 1 : 0,
      us_menu17: menus[16] ? 1 : 0,
      us_menu18: menus[17] ? 1 : 0,
      us_menu19: menus[18] ? 1 : 0,
      us_menu20: menus[19] ? 1 : 0,
    };

    let result;
    if (editingId) {
      result = await updateUsuario(editingId, payload, 'MESTRE');
    } else {
      result = await createUsuario(payload, 'MESTRE');
    }

    if (result.success) {
      setShowModal(false);
      loadData();
    } else {
      alert(result.error || 'Ocorreu um erro');
    }
  };

  const menuNames = [
    'Cadastros Clientes', 'Cadastros Serviços', 'Cadastros Profissionais', 'Configurações do Sistema',
    'Cadastros Produtos', 'Movimentação Estoque', 'Agenda Profissionais', 'Impressão de Agenda',
    'Lançar Novo Atendimento', 'Visualizar Relatórios Atendimento', 'Excluir Atendimento', 'Carregar Pedidos Expresso',
    'Pesquisar Clientes', 'Pesquisar Serviços', 'Pesquisar Profissionais', 'Pesquisar Produtos',
    'Pesquisar CEP', 'Módulo Despesas', 'Visualizar Cheques', 'Gerenciar Comissões'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased relative pb-16">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Controle de Usuários
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gerencie permissões de acesso ao sistema de recepção e celular dos profissionais.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Novo Usuário
          </button>
        </div>

        {/* Users list */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : error ? (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 text-center text-red-400">
            {error}
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Nome completo</th>
                    <th className="px-6 py-4">Login</th>
                    <th className="px-6 py-4 text-center">Permissões ativas</th>
                    <th className="px-6 py-4">Expira</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {usuarios.map((user) => {
                    const activeCount = [
                      user.us_menu1, user.us_menu2, user.us_menu3, user.us_menu4, user.us_menu5,
                      user.us_menu6, user.us_menu7, user.us_menu8, user.us_menu9, user.us_menu10,
                      user.us_menu11, user.us_menu12, user.us_menu13, user.us_menu14, user.us_menu15,
                      user.us_menu16, user.us_menu17, user.us_menu18, user.us_menu19, user.us_menu20
                    ].filter(Boolean).length;

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-200">{user.us_nome}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-xs border border-indigo-500/20">
                            {user.us_login}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            {activeCount} de 20
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {user.us_expira ? (
                            <span className="text-amber-400 font-semibold">
                              Sim ({user.us_data ? new Date(user.us_data).toLocaleDateString('pt-BR') : 'Sem data'})
                            </span>
                          ) : (
                            'Nunca'
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors text-xs"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-400 hover:text-red-300 font-medium transition-colors text-xs"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {usuarios.length === 0 && (
              <p className="text-center text-slate-500 py-12">Nenhum usuário cadastrado.</p>
            )}
          </div>
        )}

      </div>

      {/* Modal / Panel */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold mb-6 text-slate-100">
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo do usuário"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Login / Usuário *</label>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="MESTRE, WAGNER, etc."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senha *</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Expiration controls */}
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expira}
                    onChange={(e) => setExpira(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-300">Senha Expira?</span>
                    <p className="text-[10px] text-slate-500">Forçar troca periódica</p>
                  </div>
                </label>

                {expira && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data de Expiração</label>
                      <input
                        type="date"
                        value={dataExpira}
                        onChange={(e) => setDataExpira(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm outline-none text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Período (dias)</label>
                      <input
                        type="number"
                        value={periodo}
                        onChange={(e) => setPeriodo(parseInt(e.target.value) || 30)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm outline-none text-slate-200"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Permissions grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4">
                  Permissões de Telas e Ações (Controle de Menus)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                  {menuNames.map((name, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-2.5 bg-slate-950/20 hover:bg-slate-950/40 rounded-xl border border-slate-800/40 hover:border-slate-800 transition-all cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={menus[idx]}
                        onChange={() => handleToggleMenu(idx)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                      />
                      <div className="text-xs">
                        <span className="text-slate-300 font-medium">{name}</span>
                        <p className="text-[9px] text-slate-500 font-mono">Menu {idx + 1}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors text-sm font-semibold text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors text-sm font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discrete Support Label in Bottom Right */}
      <div className="fixed bottom-3 right-4 z-40 select-none pointer-events-none">
        <span className="text-[10px] font-mono text-slate-500/45 tracking-widest uppercase">
          FRM-USR
        </span>
      </div>
    </div>
  );
}
