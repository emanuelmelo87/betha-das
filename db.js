/**
 * db.js — Módulo de Banco de Dados do Portal Colaborador & Administrador DAS
 * Inclui Gestão de Remuneração Variável (RV) conforme norma CM-POL-Q-001.
 */

const DAS_DB_LOCAL_KEY = 'das_colaboradores_db_v3';
const DAS_NUMEROS_LOCAL_KEY = 'das_numeros_atendimento_v3';
const DAS_RV_COLETIVO_KEY = 'das_rv_coletivo_v3';
const DAS_SESSION_KEY = 'das_colaborador_session_v3';
const DAS_FIREBASE_URL_KEY = 'das_firebase_db_url';

const DEFAULT_FIREBASE_URL = 'https://ferramentasbrasil-default-rtdb.firebaseio.com';
const SUPERADMIN_EMAIL = 'emanuel.alexandre@betha.com.br';

// Indicadores Coletivos Padrão (75% da RV Total) conforme norma CM-POL-Q-001
const DEFAULT_RV_COLETIVO = {
  eficienciaOperacional: { peso: 15, meta: '> 90%', realizado: 92, status: 'Superado' },
  tempoImplantação: { peso: 35, meta: 'Prazo Contratual', faixaSuperacao: '2.5%', realizadoPercentual: 60, status: 'Faixa 2' },
  backlogSuporteServico: { peso: 15, meta: '< 10%', realizado: 8.5, status: 'Superado' },
  receitaOperacionalManutencao: { peso: 35, meta: 'Tabela Portfólio', faixaSuperacao: '5%', realizadoPercentual: 60, status: 'Faixa 2' }
};

// Histórico mensal padrão de RV para o ciclo Julho-Dezembro (Valores oficiais de exemplo da norma)
const DEFAULT_RV_HISTORICO_MENSAL = [
  { mes: 'Julho', csat: 94, csatMeta: 93, csatAtingido: true, horas: 95, horasMeta: 90, horasAtingido: true, rvIndividualPercent: 100, rvColetivoPercent: 45, tetoMes: 238.33 },
  { mes: 'Agosto', csat: 93, csatMeta: 93, csatAtingido: false, horas: 80, horasMeta: 90, horasAtingido: false, rvIndividualPercent: 0, rvColetivoPercent: 100, tetoMes: 238.33 },
  { mes: 'Setembro', csat: 90, csatMeta: 93, csatAtingido: false, horas: 95, horasMeta: 90, horasAtingido: true, rvIndividualPercent: 30, rvColetivoPercent: 40, tetoMes: 238.33 },
  { mes: 'Outubro', csat: 94, csatMeta: 93, csatAtingido: true, horas: 88, horasMeta: 90, horasAtingido: false, rvIndividualPercent: 70, rvColetivoPercent: 50, tetoMes: 238.33 },
  { mes: 'Novembro', csat: 94, csatMeta: 93, csatAtingido: true, horas: 91, horasMeta: 90, horasAtingido: true, rvIndividualPercent: 100, rvColetivoPercent: 90, tetoMes: 238.33 },
  { mes: 'Dezembro', csat: 93, csatMeta: 93, csatAtingido: false, horas: 90, horasMeta: 90, horasAtingido: false, rvIndividualPercent: 0, rvColetivoPercent: 75, tetoMes: 238.33 }
];

const INITIAL_EMPLOYEES = [
  {
    id: 'emp_superadmin',
    email: 'emanuel.alexandre@betha.com.br',
    nome: 'Emanuel Alexandre',
    cargo: 'Superadmin / Gestor de TI',
    gestor: 'Diretoria Betha/DAS',
    departamento: 'Gestão & Tecnologia',
    telefone: '(48) 99999-8888',
    ramal: '4003-8877 Ramal 001',
    unidade: 'Matriz DAS',
    isSuperAdmin: true,
    primeiroAcessoConcluido: false,
    senha: '',
    tetoSemestralRV: 1430.00,
    rvAtual: { csat: 94, horasProdutivas: 95, metaCsat: 93, metaHoras: 90 },
    rvHistorico: DEFAULT_RV_HISTORICO_MENSAL,
    numerosAtendimento: [
      { setor: 'Atendimento Direção', telefone: '(48) 3431-8800', ramal: '001', horario: '24h Plantão' }
    ]
  },
  {
    id: 'emp_001',
    email: 'colaborador@betha.com.br',
    nome: 'Emanuel Melo',
    cargo: 'Analista de Suporte Pleno',
    gestor: 'Roberto Almeida',
    departamento: 'Gente & Gestão',
    telefone: '(48) 99812-3456',
    ramal: '4003-8877 Ramal 204',
    unidade: 'Matriz DAS',
    isSuperAdmin: false,
    primeiroAcessoConcluido: false,
    senha: '',
    tetoSemestralRV: 1430.00,
    rvAtual: { csat: 94, horasProdutivas: 95, metaCsat: 93, metaHoras: 90 },
    rvHistorico: DEFAULT_RV_HISTORICO_MENSAL,
    numerosAtendimento: [
      { setor: 'Suporte Ponto DAS', telefone: '(48) 3431-8800', ramal: '101', horario: '08:00 - 18:00' },
      { setor: 'Gente & Gestão (RH)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30' }
    ]
  },
  {
    id: 'emp_002',
    email: 'ana.silva@betha.com.br',
    nome: 'Ana Paula Silva',
    cargo: 'Desenvolvedora Full Stack Senior',
    gestor: 'Fernanda Santos',
    departamento: 'Tecnologia & Inovação',
    telefone: '(48) 99765-4321',
    ramal: '4003-8877 Ramal 312',
    unidade: 'Filial DAS',
    isSuperAdmin: false,
    primeiroAcessoConcluido: false,
    senha: '',
    tetoSemestralRV: 1800.00,
    rvAtual: { csat: 96, horasProdutivas: 92, metaCsat: 93, metaHoras: 90 },
    rvHistorico: DEFAULT_RV_HISTORICO_MENSAL,
    numerosAtendimento: [
      { setor: 'Suporte Sistemas DAS', telefone: '(48) 3431-8820', ramal: '312', horario: '08:30 - 18:00' }
    ]
  }
];

const INITIAL_NUMEROS_GLOBAIS = [
  { id: 'num_1', setor: 'Central de Atendimento Geral', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00', tipo: 'coletivo' },
  { id: 'num_2', setor: 'Gente & Gestão (RH / Folha)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30', tipo: 'coletivo' },
  { id: 'num_3', setor: 'Service Desk & Infra TI', telefone: '(48) 3431-8850', ramal: '500', horario: '24h Plantão', tipo: 'coletivo' }
];

class DasDB {
  constructor() {
    this.firebaseUrl = localStorage.getItem(DAS_FIREBASE_URL_KEY) || DEFAULT_FIREBASE_URL;
    this.initLocal();
    this.syncFromFirebase();
  }

  getFirebaseDbUrl() { return this.firebaseUrl; }

  setFirebaseDbUrl(url) {
    if (!url) return;
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    this.firebaseUrl = cleanUrl;
    localStorage.setItem(DAS_FIREBASE_URL_KEY, cleanUrl);
    this.syncFromFirebase();
  }

  initLocal() {
    if (!localStorage.getItem(DAS_DB_LOCAL_KEY)) {
      this.saveLocalEmployees(INITIAL_EMPLOYEES);
    }
    if (!localStorage.getItem(DAS_NUMEROS_LOCAL_KEY)) {
      localStorage.setItem(DAS_NUMEROS_LOCAL_KEY, JSON.stringify(INITIAL_NUMEROS_GLOBAIS));
    }
    if (!localStorage.getItem(DAS_RV_COLETIVO_KEY)) {
      localStorage.setItem(DAS_RV_COLETIVO_KEY, JSON.stringify(DEFAULT_RV_COLETIVO));
    }
  }

  // REST API Firebase
  async fbGet(path, timeoutMs = 5000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.firebaseUrl}/${path}.json`, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  async fbSet(path, data, timeoutMs = 6000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.firebaseUrl}/${path}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  async syncFromFirebase() {
    try {
      const cloudData = await this.fbGet('das_colaboradores');
      if (cloudData) {
        const list = Array.isArray(cloudData) ? cloudData : Object.values(cloudData);
        if (list.length > 0) this.saveLocalEmployees(list);
      }
      const cloudRv = await this.fbGet('das_rv_coletivo');
      if (cloudRv) {
        localStorage.setItem(DAS_RV_COLETIVO_KEY, JSON.stringify(cloudRv));
      }
    } catch (e) {
      console.log('Firebase offline ou pendente. Usando local DB:', e.message);
    }
  }

  async syncToFirebase() {
    try {
      await this.fbSet('das_colaboradores', this.getAllLocalEmployees());
      await this.fbSet('das_rv_coletivo', this.getRvColetivo());
    } catch (e) {
      console.warn('Erro ao salvar no Firebase:', e.message);
    }
  }

  getAllLocalEmployees() {
    try {
      const data = localStorage.getItem(DAS_DB_LOCAL_KEY);
      return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
    } catch (e) {
      return INITIAL_EMPLOYEES;
    }
  }

  saveLocalEmployees(employees) {
    localStorage.setItem(DAS_DB_LOCAL_KEY, JSON.stringify(employees));
  }

  findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.getAllLocalEmployees().find(e => e.email.toLowerCase() === cleanEmail) || null;
  }

  concluirPrimeiroAcesso(email, novaSenha, dadosAdicionais = {}) {
    const employees = this.getAllLocalEmployees();
    const cleanEmail = email.trim().toLowerCase();
    const index = employees.findIndex(e => e.email.toLowerCase() === cleanEmail);

    let employee;
    const isSuperAdmin = cleanEmail === SUPERADMIN_EMAIL.toLowerCase();

    if (index >= 0) {
      employees[index].senha = novaSenha;
      employees[index].primeiroAcessoConcluido = true;
      employees[index].dataPrimeiroAcesso = new Date().toISOString();
      employees[index].isSuperAdmin = isSuperAdmin || !!employees[index].isSuperAdmin;
      employee = employees[index];
    } else {
      employee = {
        id: 'emp_' + Date.now(),
        email: cleanEmail,
        nome: dadosAdicionais.nome || cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        cargo: dadosAdicionais.cargo || (isSuperAdmin ? 'Superadmin / TI' : 'Colaborador DAS'),
        gestor: dadosAdicionais.gestor || 'Roberto Almeida',
        departamento: dadosAdicionais.departamento || 'DAS Portal',
        telefone: dadosAdicionais.telefone || '(48) 99812-3456',
        ramal: 'Ramal ' + Math.floor(100 + Math.random() * 900),
        unidade: 'Matriz DAS',
        isSuperAdmin: isSuperAdmin,
        primeiroAcessoConcluido: true,
        senha: novaSenha,
        tetoSemestralRV: 1430.00,
        rvAtual: { csat: 94, horasProdutivas: 95, metaCsat: 93, metaHoras: 90 },
        rvHistorico: DEFAULT_RV_HISTORICO_MENSAL,
        numerosAtendimento: [
          { setor: 'Atendimento Geral DAS', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00' }
        ]
      };
      employees.push(employee);
    }

    this.saveLocalEmployees(employees);
    this.syncToFirebase();
    return employee;
  }

  // ------------------------------------------------------------------
  // GESTÃO DE RV (REMUNERAÇÃO VARIÁVEL CM-POL-Q-001)
  // ------------------------------------------------------------------
  getRvColetivo() {
    try {
      const data = localStorage.getItem(DAS_RV_COLETIVO_KEY);
      return data ? JSON.parse(data) : DEFAULT_RV_COLETIVO;
    } catch (e) {
      return DEFAULT_RV_COLETIVO;
    }
  }

  adminAtualizarRvColaborador(id, dadosRv) {
    const employees = this.getAllLocalEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Colaborador não encontrado.');

    employees[index].rvAtual = {
      ...employees[index].rvAtual,
      csat: parseFloat(dadosRv.csat),
      horasProdutivas: parseFloat(dadosRv.horasProdutivas)
    };
    if (dadosRv.tetoSemestralRV) {
      employees[index].tetoSemestralRV = parseFloat(dadosRv.tetoSemestralRV);
    }

    this.saveLocalEmployees(employees);
    this.syncToFirebase();
    return employees[index];
  }

  // ------------------------------------------------------------------
  // OPERAÇÕES DO SUPERADMIN
  // ------------------------------------------------------------------
  adminCriarColaborador(dados) {
    const employees = this.getAllLocalEmployees();
    const cleanEmail = dados.email.trim().toLowerCase();

    if (employees.some(e => e.email.toLowerCase() === cleanEmail)) {
      throw new Error('E-mail já cadastrado na base de dados.');
    }

    const newEmp = {
      id: 'emp_' + Date.now(),
      email: cleanEmail,
      nome: dados.nome.trim(),
      cargo: dados.cargo.trim(),
      gestor: dados.gestor.trim() || 'Gestão Geral',
      departamento: dados.departamento.trim() || 'DAS',
      telefone: dados.telefone.trim() || '(48) 99000-0000',
      ramal: dados.ramal ? dados.ramal.trim() : 'Ramal ' + Math.floor(100 + Math.random() * 900),
      unidade: dados.unidade || 'Matriz DAS',
      isSuperAdmin: cleanEmail === SUPERADMIN_EMAIL.toLowerCase(),
      primeiroAcessoConcluido: false,
      senha: '',
      tetoSemestralRV: parseFloat(dados.tetoSemestralRV) || 1430.00,
      rvAtual: { csat: 94, horasProdutivas: 95, metaCsat: 93, metaHoras: 90 },
      rvHistorico: DEFAULT_RV_HISTORICO_MENSAL,
      numerosAtendimento: [
        { setor: 'Atendimento Geral', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00' }
      ]
    };

    employees.push(newEmp);
    this.saveLocalEmployees(employees);
    this.syncToFirebase();
    return newEmp;
  }

  adminEditarColaborador(id, novosDados) {
    const employees = this.getAllLocalEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Colaborador não encontrado.');

    employees[index] = { ...employees[index], ...novosDados };
    this.saveLocalEmployees(employees);
    this.syncToFirebase();
    return employees[index];
  }

  adminResetarSenha(id) {
    const employees = this.getAllLocalEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Colaborador não encontrado.');

    employees[index].senha = '';
    employees[index].primeiroAcessoConcluido = false;
    this.saveLocalEmployees(employees);
    this.syncToFirebase();
    return employees[index];
  }

  adminExcluirColaborador(id) {
    let employees = this.getAllLocalEmployees();
    employees = employees.filter(e => e.id !== id);
    this.saveLocalEmployees(employees);
    this.syncToFirebase();
  }

  getNumerosGlobais() {
    try {
      const data = localStorage.getItem(DAS_NUMEROS_LOCAL_KEY);
      return data ? JSON.parse(data) : INITIAL_NUMEROS_GLOBAIS;
    } catch (e) {
      return INITIAL_NUMEROS_GLOBAIS;
    }
  }

  adminAdicionarNumeroGlobal(num) {
    const list = this.getNumerosGlobais();
    const newItem = {
      id: 'num_' + Date.now(),
      setor: num.setor.trim(),
      telefone: num.telefone.trim(),
      ramal: num.ramal.trim(),
      horario: num.horario.trim() || '08:00 - 18:00',
      tipo: 'coletivo'
    };
    list.push(newItem);
    localStorage.setItem(DAS_NUMEROS_LOCAL_KEY, JSON.stringify(list));
    this.syncToFirebase();
    return newItem;
  }

  adminExcluirNumeroGlobal(id) {
    let list = this.getNumerosGlobais();
    list = list.filter(n => n.id !== id);
    localStorage.setItem(DAS_NUMEROS_LOCAL_KEY, JSON.stringify(list));
    this.syncToFirebase();
  }

  autenticar(email, senha) {
    const employee = this.findByEmail(email);
    if (!employee) return { success: false, message: 'E-mail não cadastrado na base DAS.' };
    if (!employee.primeiroAcessoConcluido) return { success: false, requireFirstAccess: true, message: 'Você ainda não concluiu o Primeiro Acesso.' };
    if (employee.senha !== senha) return { success: false, message: 'Senha incorreta. Tente novamente.' };

    this.setSession(employee);
    return { success: true, employee };
  }

  setSession(employee) {
    localStorage.setItem(DAS_SESSION_KEY, JSON.stringify({ employee, timestamp: Date.now() }));
  }

  getSession() {
    try {
      const data = localStorage.getItem(DAS_SESSION_KEY);
      if (!data) return null;
      const session = JSON.parse(data);
      if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        this.clearSession();
        return null;
      }
      return session.employee;
    } catch (e) {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem(DAS_SESSION_KEY);
  }
}

window.bethaDB = new DasDB();
