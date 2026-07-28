/**
 * db.js — Módulo de Banco de Dados do Portal Colaborador & Administrador DAS
 * Suporta Firebase Realtime Database (via REST API) + Sincronização e Fallback com LocalStorage.
 */

const DAS_DB_LOCAL_KEY = 'das_colaboradores_db_v2';
const DAS_NUMEROS_LOCAL_KEY = 'das_numeros_atendimento_v2';
const DAS_SESSION_KEY = 'das_colaborador_session_v2';
const DAS_FIREBASE_URL_KEY = 'das_firebase_db_url';

// URL Padrão do Firebase Realtime Database (Pode ser alterada pelo Superadmin no Painel Admin)
const DEFAULT_FIREBASE_URL = 'https://ferramentasbrasil-default-rtdb.firebaseio.com';

// E-mail oficial do Superadmin
const SUPERADMIN_EMAIL = 'emanuel.alexandre@betha.com.br';

// Base de dados inicial de colaboradores DAS
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
    numerosAtendimento: [
      { setor: 'Suporte Ponto DAS', telefone: '(48) 3431-8800', ramal: '101', horario: '08:00 - 18:00' },
      { setor: 'Gente & Gestão (RH)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30' },
      { setor: 'Service Desk TI DAS', telefone: '(48) 3431-8850', ramal: '500', horario: '24h Plantão' }
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
    numerosAtendimento: [
      { setor: 'Suporte Sistemas DAS', telefone: '(48) 3431-8820', ramal: '312', horario: '08:30 - 18:00' },
      { setor: 'DevOps & Infra', telefone: '(48) 3431-8855', ramal: '505', horario: '24h Plantão' }
    ]
  }
];

// Base de números de atendimento globais (coletivos)
const INITIAL_NUMEROS_GLOBAIS = [
  { id: 'num_1', setor: 'Central de Atendimento Geral', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00', tipo: 'coletivo' },
  { id: 'num_2', setor: 'Gente & Gestão (RH / Folha)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30', tipo: 'coletivo' },
  { id: 'num_3', setor: 'Service Desk & Infra TI', telefone: '(48) 3431-8850', ramal: '500', horario: '24h Plantão', tipo: 'coletivo' },
  { id: 'num_4', setor: 'Ouvidoria & Suporte de Vendas', telefone: '(48) 3431-8890', ramal: '900', horario: '08:00 - 18:00', tipo: 'coletivo' }
];

class DasDB {
  constructor() {
    this.firebaseUrl = localStorage.getItem(DAS_FIREBASE_URL_KEY) || DEFAULT_FIREBASE_URL;
    this.initLocal();
    this.syncFromFirebase(); // Tenta sincronizar em segundo plano com Firebase
  }

  getFirebaseDbUrl() {
    return this.firebaseUrl;
  }

  setFirebaseDbUrl(url) {
    if (!url) return;
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    this.firebaseUrl = cleanUrl;
    localStorage.setItem(DAS_FIREBASE_URL_KEY, cleanUrl);
    this.syncFromFirebase();
  }

  initLocal() {
    const data = localStorage.getItem(DAS_DB_LOCAL_KEY);
    if (!data) {
      this.saveLocalEmployees(INITIAL_EMPLOYEES);
    }
    const nums = localStorage.getItem(DAS_NUMEROS_LOCAL_KEY);
    if (!nums) {
      localStorage.setItem(DAS_NUMEROS_LOCAL_KEY, JSON.stringify(INITIAL_NUMEROS_GLOBAIS));
    }
  }

  // ------------------------------------------------------------------
  // REST HELPERS (FIREBASE REALTIME DATABASE)
  // ------------------------------------------------------------------
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

  /**
   * Sincroniza dados da nuvem (Firebase) com o LocalStorage
   */
  async syncFromFirebase() {
    try {
      const cloudData = await this.fbGet('das_colaboradores');
      if (cloudData) {
        const employeesList = Array.isArray(cloudData) ? cloudData : Object.values(cloudData);
        if (employeesList.length > 0) {
          this.saveLocalEmployees(employeesList);
        }
      }

      const cloudNums = await this.fbGet('das_numeros_atendimento');
      if (cloudNums) {
        const numsList = Array.isArray(cloudNums) ? cloudNums : Object.values(cloudNums);
        if (numsList.length > 0) {
          localStorage.setItem(DAS_NUMEROS_LOCAL_KEY, JSON.stringify(numsList));
        }
      }
    } catch (e) {
      console.log('Firebase offline ou pendente de configuração. Utilizando cache LocalStorage:', e.message);
    }
  }

  async syncToFirebase() {
    try {
      const employees = this.getAllLocalEmployees();
      await this.fbSet('das_colaboradores', employees);
      const nums = this.getNumerosGlobais();
      await this.fbSet('das_numeros_atendimento', nums);
    } catch (e) {
      console.warn('Não foi possível salvar no Firebase. Salvo no LocalStorage local:', e.message);
    }
  }

  // ------------------------------------------------------------------
  // GESTÃO DE COLABORADORES
  // ------------------------------------------------------------------
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
    const employees = this.getAllLocalEmployees();
    return employees.find(e => e.email.toLowerCase() === cleanEmail) || null;
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
      if (dadosAdicionais.telefone) employees[index].telefone = dadosAdicionais.telefone;
      if (dadosAdicionais.cargo) employees[index].cargo = dadosAdicionais.cargo;
      if (dadosAdicionais.gestor) employees[index].gestor = dadosAdicionais.gestor;
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
        dataPrimeiroAcesso: new Date().toISOString(),
        numerosAtendimento: [
          { setor: 'Atendimento Geral DAS', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00' },
          { setor: 'Gente & Gestão (RH)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30' }
        ]
      };
      employees.push(employee);
    }

    this.saveLocalEmployees(employees);
    this.syncToFirebase(); // Grava na nuvem
    return employee;
  }

  // ------------------------------------------------------------------
  // OPERAÇÕES DO SUPERADMIN (ADMIN PORTAL CRUD)
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

  // ------------------------------------------------------------------
  // GESTÃO DE NÚMEROS DE ATENDIMENTO (COLETIVOS E INDIVIDUAIS)
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // AUTENTICAÇÃO E SESSÃO
  // ------------------------------------------------------------------
  autenticar(email, senha) {
    const employee = this.findByEmail(email);
    if (!employee) {
      return { success: false, message: 'E-mail não cadastrado na base DAS.' };
    }
    if (!employee.primeiroAcessoConcluido) {
      return { success: false, requireFirstAccess: true, message: 'Você ainda não concluiu o Primeiro Acesso. Por favor, crie sua senha.' };
    }
    if (employee.senha !== senha) {
      return { success: false, message: 'Senha incorreta. Tente novamente.' };
    }

    this.setSession(employee);
    return { success: true, employee };
  }

  setSession(employee) {
    localStorage.setItem(DAS_SESSION_KEY, JSON.stringify({
      employee,
      timestamp: Date.now()
    }));
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
