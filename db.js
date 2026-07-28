/**
 * db.js — Módulo de Banco de Dados do Portal Colaborador Betha
 * Armazena e gerencia informações individualizadas de cada colaborador
 * (Cargo, Gestor, E-mail, Número de Contato, Departamento, Status de Primeiro Acesso e Senha)
 */

const BETHA_DB_KEY = 'betha_colaboradores_db_v1';
const BETHA_SESSION_KEY = 'betha_colaborador_session_v1';

// Base de dados inicial de colaboradores da Betha Sistemas
const DEFAULT_EMPLOYEES = [
  {
    id: 'emp_001',
    email: 'colaborador@betha.com.br',
    nome: 'Emanuel Melo',
    cargo: 'Analista de Suporte Pleno',
    gestor: 'Roberto Almeida',
    departamento: 'Gente & Gestão',
    telefone: '(48) 99812-3456',
    ramal: '4003-8877 Ramal 204',
    unidade: 'Matriz - Criciúma/SC',
    primeiroAcessoConcluido: false,
    senha: '',
    numerosAtendimento: [
      { setor: 'Suporte Ponto', telefone: '(48) 3431-8800', ramal: '101', horario: '08:00 - 18:00' },
      { setor: 'Gente & Gestão (RH)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30' },
      { setor: 'Service Desk TI', telefone: '(48) 3431-8850', ramal: '500', horario: '24h Plantão' }
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
    unidade: 'Filial - Florianópolis/SC',
    primeiroAcessoConcluido: false,
    senha: '',
    numerosAtendimento: [
      { setor: 'Suporte Sistemas', telefone: '(48) 3431-8820', ramal: '312', horario: '08:30 - 18:00' },
      { setor: 'DevOps & Infra', telefone: '(48) 3431-8855', ramal: '505', horario: '24h Plantão' }
    ]
  },
  {
    id: 'emp_003',
    email: 'carlos.eduardo@betha.com.br',
    nome: 'Carlos Eduardo Santos',
    cargo: 'Consultor de Implantação',
    gestor: 'Marcelo Oliveira',
    departamento: 'Serviços & Operações',
    telefone: '(48) 99123-8899',
    ramal: '4003-8877 Ramal 115',
    unidade: 'Matriz - Criciúma/SC',
    primeiroAcessoConcluido: false,
    senha: '',
    numerosAtendimento: [
      { setor: 'Central de Atendimento', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00' }
    ]
  }
];

class BethaDB {
  constructor() {
    this.init();
  }

  init() {
    const data = localStorage.getItem(BETHA_DB_KEY);
    if (!data) {
      this.saveAll(DEFAULT_EMPLOYEES);
    }
  }

  getAll() {
    try {
      const data = localStorage.getItem(BETHA_DB_KEY);
      return data ? JSON.parse(data) : DEFAULT_EMPLOYEES;
    } catch (e) {
      console.error('Erro ao ler do banco de dados local:', e);
      return DEFAULT_EMPLOYEES;
    }
  }

  saveAll(employees) {
    localStorage.setItem(BETHA_DB_KEY, JSON.stringify(employees));
  }

  findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const employees = this.getAll();
    return employees.find(e => e.email.toLowerCase() === cleanEmail) || null;
  }

  /**
   * Conclui o Primeiro Acesso gravando a nova senha do colaborador no DB
   */
  concluirPrimeiroAcesso(email, novaSenha, dadosAdicionais = {}) {
    const employees = this.getAll();
    const cleanEmail = email.trim().toLowerCase();
    const index = employees.findIndex(e => e.email.toLowerCase() === cleanEmail);

    let employee;
    if (index >= 0) {
      employees[index].senha = novaSenha;
      employees[index].primeiroAcessoConcluido = true;
      employees[index].dataPrimeiroAcesso = new Date().toISOString();
      if (dadosAdicionais.telefone) employees[index].telefone = dadosAdicionais.telefone;
      if (dadosAdicionais.cargo) employees[index].cargo = dadosAdicionais.cargo;
      if (dadosAdicionais.gestor) employees[index].gestor = dadosAdicionais.gestor;
      employee = employees[index];
    } else {
      // Se não existia previamente na lista inicial, cria um registro novo individualizado
      employee = {
        id: 'emp_' + Date.now(),
        email: cleanEmail,
        nome: dadosAdicionais.nome || cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        cargo: dadosAdicionais.cargo || 'Colaborador Betha',
        gestor: dadosAdicionais.gestor || 'Roberto Almeida',
        departamento: dadosAdicionais.departamento || 'Betha Sistemas',
        telefone: dadosAdicionais.telefone || '(48) 99812-3456',
        ramal: 'Ramal ' + Math.floor(100 + Math.random() * 900),
        unidade: 'Matriz - Criciúma/SC',
        primeiroAcessoConcluido: true,
        senha: novaSenha,
        dataPrimeiroAcesso: new Date().toISOString(),
        numerosAtendimento: [
          { setor: 'Atendimento Geral', telefone: '(48) 3431-8800', ramal: '100', horario: '08:00 - 18:00' },
          { setor: 'Gente & Gestão (RH)', telefone: '(48) 3431-8812', ramal: '204', horario: '08:00 - 17:30' },
          { setor: 'Service Desk TI', telefone: '(48) 3431-8850', ramal: '500', horario: '24h Plantão' }
        ]
      };
      employees.push(employee);
    }

    this.saveAll(employees);
    return employee;
  }

  autenticar(email, senha) {
    const employee = this.findByEmail(email);
    if (!employee) {
      return { success: false, message: 'E-mail não cadastrado na base da Betha Sistemas.' };
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
    localStorage.setItem(BETHA_SESSION_KEY, JSON.stringify({
      employee,
      timestamp: Date.now()
    }));
  }

  getSession() {
    try {
      const data = localStorage.getItem(BETHA_SESSION_KEY);
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
    localStorage.removeItem(BETHA_SESSION_KEY);
  }
}

window.bethaDB = new BethaDB();
