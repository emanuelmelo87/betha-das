/**
 * app.js — Controlador de Interface e Fluxo de Primeiro Acesso
 * Portal Colaborador Betha Sistemas
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado global do fluxo
  const state = {
    step: 1, // 1: E-mail, 2: OTP, 3: Criar Senha, 4: Sucesso/Conclusão
    email: '',
    otpGerado: '',
    employeeData: null,
    modoLogin: false // false: Primeiro Acesso, true: Login Regular
  };

  // Elementos DOM principais
  const viewFirstAccess = document.getElementById('viewFirstAccess');
  const viewDashboard = document.getElementById('viewDashboard');
  const userHeaderContainer = document.getElementById('userHeaderContainer');

  // Elementos do Form de Primeiro Acesso
  const stepContainer1 = document.getElementById('stepContainer1');
  const stepContainer2 = document.getElementById('stepContainer2');
  const stepContainer3 = document.getElementById('stepContainer3');
  const stepContainer4 = document.getElementById('stepContainer4');
  const loginFormContainer = document.getElementById('loginFormContainer');

  const inputEmail = document.getElementById('inputEmail');
  const btnStep1Next = document.getElementById('btnStep1Next');
  const emailErrorMsg = document.getElementById('emailErrorMsg');

  const inputOtp = document.getElementById('inputOtp');
  const btnStep2Next = document.getElementById('btnStep2Next');
  const btnResendOtp = document.getElementById('btnResendOtp');
  const otpHintBox = document.getElementById('otpHintBox');
  const otpCodeSpan = document.getElementById('otpCodeSpan');

  const inputSenha = document.getElementById('inputSenha');
  const inputConfirmarSenha = document.getElementById('inputConfirmarSenha');
  const btnStep3Next = document.getElementById('btnStep3Next');
  const strengthBarFill = document.getElementById('strengthBarFill');
  const strengthText = document.getElementById('strengthText');
  const pwdErrorMsg = document.getElementById('pwdErrorMsg');

  const btnGoToDashboard = document.getElementById('btnGoToDashboard');

  // Elementos do Formulário de Login Regular
  const inputLoginEmail = document.getElementById('inputLoginEmail');
  const inputLoginSenha = document.getElementById('inputLoginSenha');
  const btnDoLogin = document.getElementById('btnDoLogin');
  const loginErrorMsg = document.getElementById('loginErrorMsg');

  // Alternadores de Modo (Primeiro Acesso vs Login)
  const linkSwitchToLogin = document.getElementById('linkSwitchToLogin');
  const linkSwitchToFirstAccess = document.getElementById('linkSwitchToFirstAccess');

  // Verificar se já existe uma sessão ativa ao carregar
  checkExistingSession();

  // ------------------------------------------------------------------
  // 1. ALTERNÂNCIA DE MODOS (PRIMEIRO ACESSO vs LOGIN REGULAR)
  // ------------------------------------------------------------------
  if (linkSwitchToLogin) {
    linkSwitchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      setModeLogin(true);
    });
  }

  if (linkSwitchToFirstAccess) {
    linkSwitchToFirstAccess.addEventListener('click', (e) => {
      e.preventDefault();
      setModeLogin(false);
    });
  }

  function setModeLogin(isLogin) {
    state.modoLogin = isLogin;
    if (isLogin) {
      document.getElementById('firstAccessWizard').style.display = 'none';
      loginFormContainer.style.display = 'flex';
    } else {
      document.getElementById('firstAccessWizard').style.display = 'flex';
      loginFormContainer.style.display = 'none';
    }
  }

  // ------------------------------------------------------------------
  // 2. ETAPA 1: VALIDAÇÃO DE E-MAIL BETHA
  // ------------------------------------------------------------------
  if (btnStep1Next) {
    btnStep1Next.addEventListener('click', handleStep1);
  }

  if (inputEmail) {
    inputEmail.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleStep1();
    });
  }

  function handleStep1() {
    const email = inputEmail.value.trim().toLowerCase();
    emailErrorMsg.textContent = '';

    if (!email) {
      emailErrorMsg.textContent = 'Por favor, informe seu e-mail institucional.';
      return;
    }

    if (!email.endsWith('@betha.com.br') && !email.endsWith('@betha.com')) {
      emailErrorMsg.textContent = 'O e-mail deve pertencer ao domínio corporativo @betha.com.br';
      return;
    }

    // Verificar no banco de dados local se o colaborador já concluiu o primeiro acesso
    const emp = window.bethaDB.findByEmail(email);
    if (emp && emp.primeiroAcessoConcluido) {
      emailErrorMsg.textContent = 'Este e-mail já realizou o Primeiro Acesso. Utilize a opção "Já tenho senha / Entrar".';
      return;
    }

    state.email = email;
    state.employeeData = emp;

    // Gerar código OTP de teste (6 dígitos)
    state.otpGerado = Math.floor(100000 + Math.random() * 900000).toString();
    otpCodeSpan.textContent = state.otpGerado;

    // Transitar para o Passo 2
    goToStep(2);
    showToast('Código de verificação enviado para ' + email);
  }

  // ------------------------------------------------------------------
  // 3. ETAPA 2: VERIFICAÇÃO DO CÓDIGO OTP
  // ------------------------------------------------------------------
  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', handleStep2);
  }

  if (btnResendOtp) {
    btnResendOtp.addEventListener('click', () => {
      state.otpGerado = Math.floor(100000 + Math.random() * 900000).toString();
      otpCodeSpan.textContent = state.otpGerado;
      showToast('Novo código gerado com sucesso!');
    });
  }

  function handleStep2() {
    const code = inputOtp.value.trim();
    if (code !== state.otpGerado) {
      showToast('Código inválido. Digite o código de 6 dígitos exibido no quadro.', 'error');
      return;
    }

    goToStep(3);
  }

  // ------------------------------------------------------------------
  // 4. ETAPA 3: CRIAÇÃO DE SENHA E MEDIDOR DE FORÇA
  // ------------------------------------------------------------------
  if (inputSenha) {
    inputSenha.addEventListener('input', updatePasswordStrength);
  }
  if (inputConfirmarSenha) {
    inputConfirmarSenha.addEventListener('input', validatePasswordMatch);
  }

  if (btnStep3Next) {
    btnStep3Next.addEventListener('click', handleStep3);
  }

  function updatePasswordStrength() {
    const pwd = inputSenha.value;
    let score = 0;

    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    strengthBarFill.style.width = score + '%';

    if (score <= 25) {
      strengthBarFill.style.backgroundColor = '#d32f2f'; // Vermelho
      strengthText.textContent = 'Força da senha: Fraca (Mínimo 8 caracteres)';
      strengthText.style.color = '#d32f2f';
    } else if (score <= 75) {
      strengthBarFill.style.backgroundColor = '#ed6c02'; // Laranja
      strengthText.textContent = 'Força da senha: Média (Adicione letras maiúsculas e símbolos)';
      strengthText.style.color = '#ed6c02';
    } else {
      strengthBarFill.style.backgroundColor = '#2e7d32'; // Verde
      strengthText.textContent = 'Força da senha: Forte e Segura!';
      strengthText.style.color = '#2e7d32';
    }

    validatePasswordMatch();
  }

  function validatePasswordMatch() {
    const pwd = inputSenha.value;
    const confirm = inputConfirmarSenha.value;
    pwdErrorMsg.textContent = '';

    if (confirm && pwd !== confirm) {
      pwdErrorMsg.textContent = 'As senhas não coincidem.';
      return false;
    }
    return true;
  }

  function handleStep3() {
    const pwd = inputSenha.value;
    const confirm = inputConfirmarSenha.value;
    pwdErrorMsg.textContent = '';

    if (pwd.length < 8) {
      pwdErrorMsg.textContent = 'A senha deve ter no mínimo 8 caracteres.';
      return;
    }

    if (pwd !== confirm) {
      pwdErrorMsg.textContent = 'As senhas digitadas não são iguais.';
      return;
    }

    // Salvar no banco de dados individualizado
    const updatedEmployee = window.bethaDB.concluirPrimeiroAcesso(state.email, pwd, {
      nome: state.employeeData ? state.employeeData.nome : null,
      cargo: state.employeeData ? state.employeeData.cargo : null,
      gestor: state.employeeData ? state.employeeData.gestor : null
    });

    state.employeeData = updatedEmployee;

    // Transitar para o Passo 4 (Sucesso)
    goToStep(4);
    renderSuccessStepDetails(updatedEmployee);
  }

  function renderSuccessStepDetails(emp) {
    const detailsContainer = document.getElementById('createdProfileDetails');
    if (detailsContainer && emp) {
      detailsContainer.innerHTML = `
        <div style="background:#f4f5f7; border:1px solid #e0e0e0; padding:16px; border-radius:8px; text-align:left; font-size:0.9rem; margin-top:12px;">
          <div style="font-weight:700; color:#1976d2; margin-bottom:6px;">Perfil Cadastrado com Sucesso:</div>
          <div><strong>Colaborador:</strong> ${emp.nome}</div>
          <div><strong>E-mail Betha:</strong> ${emp.email}</div>
          <div><strong>Cargo:</strong> ${emp.cargo}</div>
          <div><strong>Gestor Direto:</strong> ${emp.gestor}</div>
          <div><strong>Departamento:</strong> ${emp.departamento}</div>
        </div>
      `;
    }
  }

  // ------------------------------------------------------------------
  // 5. ETAPA 4: NAVEGAÇÃO PARA O DASHBOARD
  // ------------------------------------------------------------------
  if (btnGoToDashboard) {
    btnGoToDashboard.addEventListener('click', () => {
      // Definir sessão ativa para o colaborador recém-cadastrado
      window.bethaDB.setSession(state.employeeData);
      showDashboard(state.employeeData);
    });
  }

  // ------------------------------------------------------------------
  // 6. FORMULÁRIO DE LOGIN REGULAR
  // ------------------------------------------------------------------
  if (btnDoLogin) {
    btnDoLogin.addEventListener('click', handleLogin);
  }

  function handleLogin() {
    const email = inputLoginEmail.value.trim();
    const senha = inputLoginSenha.value.trim();
    loginErrorMsg.textContent = '';

    if (!email || !senha) {
      loginErrorMsg.textContent = 'Preencha e-mail e senha para acessar.';
      return;
    }

    const res = window.bethaDB.autenticar(email, senha);
    if (!res.success) {
      if (res.requireFirstAccess) {
        loginErrorMsg.textContent = res.message;
        setTimeout(() => setModeLogin(false), 2000);
      } else {
        loginErrorMsg.textContent = res.message;
      }
      return;
    }

    showDashboard(res.employee);
  }

  // ------------------------------------------------------------------
  // 7. EXIBIÇÃO E RENDERIZAÇÃO DO DASHBOARD INDIVIDUALIZADO
  // ------------------------------------------------------------------
  function showDashboard(emp) {
    viewFirstAccess.style.display = 'none';
    viewDashboard.style.display = 'flex';

    // Renderizar dados no Header
    userHeaderContainer.innerHTML = `
      <div class="user-profile-badge">
        <div class="avatar-circle">${emp.nome.charAt(0)}</div>
        <div style="display:flex; flex-direction:column; line-height:1.2;">
          <span style="font-weight:700; color:#fff;">${emp.nome}</span>
          <span style="font-size:0.75rem; color:#b0bec5;">${emp.cargo}</span>
        </div>
      </div>
      <button id="btnLogout" class="btn-header-logout" title="Sair do Portal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        Sair
      </button>
    `;

    document.getElementById('btnLogout').addEventListener('click', () => {
      window.bethaDB.clearSession();
      window.location.reload();
    });

    // Preencher as informações individualizadas do Colaborador no Painel
    document.getElementById('dashNomeColaborador').textContent = emp.nome;
    document.getElementById('dashEmailColaborador').textContent = emp.email;
    document.getElementById('dashCargoColaborador').textContent = emp.cargo;
    document.getElementById('dashGestorColaborador').textContent = emp.gestor;
    document.getElementById('dashDeptColaborador').textContent = emp.departamento;
    document.getElementById('dashTelefoneColaborador').textContent = emp.telefone || '(48) 99812-3456';
    document.getElementById('dashUnidadeColaborador').textContent = emp.unidade || 'Matriz - Criciúma/SC';

    // Renderizar tabela de números de atendimento
    renderNumbersTable(emp.numerosAtendimento || []);

    showToast('Bem-vindo ao Portal Colaborador Betha, ' + emp.nome + '!');
  }

  function renderNumbersTable(numeros) {
    const container = document.getElementById('numbersTableBody');
    if (!container) return;

    if (!numeros || numeros.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div class="empty-state-title">Ainda não há números específicos configurados.</div>
              <div class="empty-state-text">Utilize o atendimento central pelo ramal 100.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = numeros.map(n => `
      <tr>
        <td style="font-weight:600; color:#1976d2;">${n.setor}</td>
        <td>${n.telefone}</td>
        <td><strong style="color:#333;">${n.ramal}</strong></td>
        <td><span class="badge-horario">${n.horario}</span></td>
      </tr>
    `).join('');
  }

  // ------------------------------------------------------------------
  // 8. HELPERS & NAVEGAÇÃO DE PASSOS DO WIZARD
  // ------------------------------------------------------------------
  function goToStep(stepNum) {
    state.step = stepNum;

    // Atualizar visual dos passos
    for (let i = 1; i <= 4; i++) {
      const stepItem = document.getElementById('stepItem' + i);
      const container = document.getElementById('stepContainer' + i);

      if (stepItem) {
        stepItem.classList.remove('active', 'completed');
        if (i < stepNum) stepItem.classList.add('completed');
        if (i === stepNum) stepItem.classList.add('active');
      }

      if (container) {
        container.style.display = i === stepNum ? 'block' : 'none';
      }
    }
  }

  function checkExistingSession() {
    const activeUser = window.bethaDB.getSession();
    if (activeUser) {
      showDashboard(activeUser);
    }
  }

  function showToast(message, type = 'info') {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // Busca em tempo real na tabela de números
  const searchInput = document.getElementById('dashSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#numbersTableBody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
});
