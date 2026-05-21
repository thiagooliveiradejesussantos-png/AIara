// ============================================
// AIARA - LÓGICA PRINCIPAL
// ============================================

var isTyping = false;
var chatHistory = [];

// Elementos DOM
var chatContainer = document.getElementById('chatContainer');
var chatInput = document.getElementById('chatInput');
var sendBtn = document.getElementById('sendBtn');
var welcomeScreen = document.getElementById('welcomeScreen');
var historyList = document.getElementById('historyList');
var newChatBtn = document.getElementById('newChatBtn');

console.log('=== AIARA INICIANDO ===');
console.log('chatContainer:', chatContainer ? 'OK' : 'FALHA');
console.log('chatInput:', chatInput ? 'OK' : 'FALHA');
console.log('sendBtn:', sendBtn ? 'OK' : 'FALHA');

// ============================================
// EVENTOS
// ============================================

// Botão enviar - clique
sendBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('>>> BOTÃO ENVIAR CLICADO!');
    enviarMensagem();
});

// Tecla Enter
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        console.log('>>> TECLA ENTER PRESSIONADA!');
        enviarMensagem();
    }
});

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

// Novo chat
newChatBtn.addEventListener('click', function() {
    console.log('>>> NOVO CHAT CLICADO!');
    welcomeScreen.style.display = 'flex';
    var msgs = document.querySelectorAll('.message');
    for (var i = 0; i < msgs.length; i++) {
        msgs[i].remove();
    }
    chatInput.value = '';
    chatInput.style.height = 'auto';
});

// Sugestões
var suggestionCards = document.querySelectorAll('.suggestion-card');
for (var i = 0; i < suggestionCards.length; i++) {
    suggestionCards[i].addEventListener('click', function() {
        var text = this.getAttribute('data-suggestion');
        console.log('>>> SUGESTÃO CLICADA:', text);
        chatInput.value = text;
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
        enviarMensagem();
    });
}

// ============================================
// FUNÇÃO PRINCIPAL: ENVIAR MENSAGEM
// ============================================

function enviarMensagem() {
    var text = chatInput.value.trim();

    console.log('=== ENVIAR MENSAGEM ===');
    console.log('Texto:', text);
    console.log('isTyping:', isTyping);

    if (!text) {
        console.log('Texto vazio, ignorando');
        return;
    }

    if (isTyping) {
        console.log('Já está processando, ignorando');
        return;
    }

    // Adicionar mensagem do usuário
    adicionarMensagem('user', text);

    // Limpar input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Bloquear e mostrar typing
    isTyping = true;
    sendBtn.disabled = true;
    mostrarTyping();

    // Gerar resposta após delay
    setTimeout(function() {
        console.log('Gerando resposta...');
        esconderTyping();

        var response = gerarResposta(text);
        console.log('Resposta gerada, tamanho:', response.length);

        adicionarMensagem('ai', response);

        isTyping = false;
        sendBtn.disabled = false;

        // Salvar histórico
        chatHistory.push({
            title: text.length > 30 ? text.substring(0, 30) + '...' : text,
            timestamp: new Date().toISOString()
        });

        try {
            localStorage.setItem('aiara_history', JSON.stringify(chatHistory.slice(-20)));
        } catch(e) {
            console.log('Erro ao salvar histórico:', e);
        }

        carregarHistorico();

    }, 1500);
}

// ============================================
// ADICIONAR MENSAGEM NA TELA
// ============================================

function adicionarMensagem(role, content) {
    console.log('Adicionando mensagem:', role);

    welcomeScreen.style.display = 'none';

    var messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + role;

    var avatar = document.createElement('div');
    avatar.className = 'avatar ' + role;
    avatar.textContent = role === 'user' ? 'Você' : 'AI';

    var contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (role === 'ai') {
        contentDiv.innerHTML = formatarResposta(content);
    } else {
        contentDiv.innerHTML = '<p>' + escaparHtml(content) + '</p>';
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);

    // Syntax highlight
    var codeBlocks = messageDiv.querySelectorAll('pre code');
    for (var i = 0; i < codeBlocks.length; i++) {
        if (window.hljs) {
            hljs.highlightElement(codeBlocks[i]);
        }
    }

    // Scroll para baixo
    chatContainer.scrollTop = chatContainer.scrollHeight;

    console.log('Mensagem adicionada!');
}

// ============================================
// FORMATAR RESPOSTA (texto + código)
// ============================================

function formatarResposta(text) {
    var html = '';
    var parts = text.split(/(```[\s\S]*?```)/);

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];

        if (part.indexOf('```') === 0) {
            // Bloco de código
            var match = part.match(/```(\w+)?
([\s\S]*?)```/);
            if (match) {
                var lang = match[1] || 'text';
                var code = match[2].trim();
                var escapedCode = escaparHtml(code);

                html += '<div class="code-block">' +
                    '<div class="code-header">' +
                    '<span class="code-lang">' + lang + '</span>' +
                    '<button class="copy-btn" onclick="copiarCodigo(this)">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
                    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
                    '</svg> Copiar' +
                    '</button>' +
                    '</div>' +
                    '<pre><code class="language-' + lang + '">' + escapedCode + '</code></pre>' +
                    '</div>';
            }
        } else {
            // Texto normal
            var lines = part.trim().split('
');
            for (var j = 0; j < lines.length; j++) {
                var line = lines[j];
                if (line.trim()) {
                    html += '<p>' + escaparHtml(line) + '</p>';
                }
            }
        }
    }

    return html || '<p>' + escaparHtml(text) + '</p>';
}

function escaparHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// COPIAR CÓDIGO
// ============================================

function copiarCodigo(btn) {
    var codeBlock = btn.closest('.code-block').querySelector('code');
    var text = codeBlock.textContent;

    navigator.clipboard.writeText(text).then(function() {
        btn.classList.add('copied');
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado!';

        setTimeout(function() {
            btn.classList.remove('copied');
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copiar';
        }, 2000);
    }).catch(function() {
        // Fallback para navegadores antigos
        var textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

// ============================================
// TYPING INDICATOR
// ============================================

function mostrarTyping() {
    var typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="avatar ai">AI</div>' +
        '<div class="message-content">' +
        '<div class="typing">' +
        '<div class="typing-dot"></div>' +
        '<div class="typing-dot"></div>' +
        '<div class="typing-dot"></div>' +
        '</div></div>';
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function esconderTyping() {
    var typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// ============================================
// HISTÓRICO
// ============================================

function carregarHistorico() {
    historyList.innerHTML = '';
    for (var i = chatHistory.length - 1; i >= 0; i--) {
        var item = chatHistory[i];
        var div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> ' + item.title;
        historyList.appendChild(div);
    }
}

// ============================================
// BANCO DE SCRIPTS
// ============================================

var scriptsDB = {
    voo: `local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local flying = false
local flySpeed = 50
local bodyVelocity = nil
local bodyGyro = nil

local function startFlying()
    flying = true
    local character = player.Character
    if not character then return end
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    bodyVelocity = Instance.new("BodyVelocity")
    bodyVelocity.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bodyVelocity.Velocity = Vector3.new(0, 0, 0)
    bodyVelocity.Parent = rootPart

    bodyGyro = Instance.new("BodyGyro")
    bodyGyro.MaxTorque = Vector3.new(math.huge, math.huge, math.huge)
    bodyGyro.P = 10000
    bodyGyro.CFrame = rootPart.CFrame
    bodyGyro.Parent = rootPart
end

local function stopFlying()
    flying = false
    if bodyVelocity then bodyVelocity:Destroy() bodyVelocity = nil end
    if bodyGyro then bodyGyro:Destroy() bodyGyro = nil end
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.F then
        if flying then stopFlying() else startFlying() end
    end
end)

RunService.RenderStepped:Connect(function()
    if not flying then return end
    local character = player.Character
    if not character then return end
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local camera = workspace.CurrentCamera
    local direction = Vector3.new(0, 0, 0)

    if UserInputService:IsKeyDown(Enum.KeyCode.W) then direction = direction + camera.CFrame.LookVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.S) then direction = direction - camera.CFrame.LookVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.A) then direction = direction - camera.CFrame.RightVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.D) then direction = direction + camera.CFrame.RightVector end
    if UserInputService:IsKeyDown(Enum.KeyCode.Space) then direction = direction + Vector3.new(0, 1, 0) end
    if UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) then direction = direction - Vector3.new(0, 1, 0) end

    if direction.Magnitude > 0 then direction = direction.Unit * flySpeed end

    bodyVelocity.Velocity = direction
    bodyGyro.CFrame = camera.CFrame
end)

print("Sistema de Voo carregado! Pressione F para voar.")`,

    arma: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local weaponsFolder = ReplicatedStorage:WaitForChild("Weapons")
local spawnPoints = workspace:WaitForChild("SpawnPoints")

local SPAWN_INTERVAL = 10
local MAX_WEAPONS = 5
local spawnedWeapons = {}

local function getRandomWeapon()
    local weapons = weaponsFolder:GetChildren()
    if #weapons == 0 then return nil end
    return weapons[math.random(1, #weapons)]
end

local function getRandomSpawnPoint()
    local points = spawnPoints:GetChildren()
    if #points == 0 then return nil end
    return points[math.random(1, #points)]
end

local function spawnWeapon()
    if #spawnedWeapons >= MAX_WEAPONS then
        local oldWeapon = table.remove(spawnedWeapons, 1)
        if oldWeapon and oldWeapon.Parent then oldWeapon:Destroy() end
    end

    local weaponTemplate = getRandomWeapon()
    local spawnPoint = getRandomSpawnPoint()
    if not weaponTemplate or not spawnPoint then return end

    local newWeapon = weaponTemplate:Clone()
    local offset = Vector3.new(math.random(-2, 2), 1, math.random(-2, 2))
    newWeapon:SetPrimaryPartCFrame(spawnPoint.CFrame + offset)

    local touchConnection
    touchConnection = newWeapon.PrimaryPart.Touched:Connect(function(hit)
        local player = Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            local backpack = player:FindFirstChild("Backpack")
            if backpack then
                local weaponClone = newWeapon:Clone()
                weaponClone.Parent = backpack
                newWeapon:Destroy()
                touchConnection:Disconnect()
            end
        end
    end)

    newWeapon.Parent = workspace
    table.insert(spawnedWeapons, newWeapon)
end

while true do
    spawnWeapon()
    task.wait(SPAWN_INTERVAL)
end`,

    media: `class CalculadoraMedia:
    def __init__(self):
        self.notas = []
        self.pesos = []

    def adicionar_nota(self, nota, peso=1.0):
        if 0 <= nota <= 10:
            self.notas.append(nota)
            self.pesos.append(peso)
            print(f"Nota {nota} (peso {peso}) adicionada!")
        else:
            print("Nota deve estar entre 0 e 10")

    def media_simples(self):
        if not self.notas:
            return 0
        return sum(self.notas) / len(self.notas)

    def media_ponderada(self):
        if not self.notas:
            return 0
        soma_ponderada = sum(n * p for n, p in zip(self.notas, self.pesos))
        soma_pesos = sum(self.pesos)
        return soma_ponderada / soma_pesos if soma_pesos > 0 else 0

    def situacao(self, media):
        if media >= 7.0:
            return "APROVADO"
        elif media >= 5.0:
            return "RECUPERACAO"
        else:
            return "REPROVADO"

    def relatorio(self):
        media_s = self.media_simples()
        media_p = self.media_ponderada()

        print("="*40)
        print("RELATORIO DO ALUNO")
        print("="*40)

        for i, (nota, peso) in enumerate(zip(self.notas, self.pesos), 1):
            print(f"  Nota {i}: {nota:.1f} (peso: {peso})")

        print("-"*40)
        print(f"  Media Simples:    {media_s:.2f}")
        print(f"  Media Ponderada:  {media_p:.2f}")
        print(f"  Situacao:         {self.situacao(media_p)}")
        print("="*40)

        return media_p


def main():
    print("Bem-vindo a Calculadora de Media!")

    calc = CalculadoraMedia()
    calc.adicionar_nota(8.5, peso=2.0)
    calc.adicionar_nota(7.0, peso=2.0)
    calc.adicionar_nota(9.0, peso=1.0)
    calc.adicionar_nota(6.5, peso=1.0)

    media_final = calc.relatorio()

    if media_final < 7.0:
        print(f"Voce precisa de {14 - media_final:.2f} na proxima para passar!")


if __name__ == "__main__":
    main()`,

    banco: `import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class SistemaBancario {
    public static void main(String[] args) {
        Banco banco = new Banco("AIara Bank");

        System.out.println("Bem-vindo ao " + banco.getNome());
        System.out.println("=".repeat(40));

        Conta conta1 = banco.criarConta("Joao Silva", "123.456.789-00", 1000.0);
        Conta conta2 = banco.criarConta("Maria Santos", "987.654.321-00", 500.0);

        conta1.depositar(500.0);
        conta1.transferir(conta2, 200.0);
        conta2.sacar(100.0);

        conta1.exibirExtrato();
        conta2.exibirExtrato();
    }
}

class Conta {
    private static int contador = 1000;
    private int numero;
    private String titular;
    private String cpf;
    private double saldo;
    private List<Transacao> historico;

    public Conta(String titular, String cpf, double saldoInicial) {
        this.numero = ++contador;
        this.titular = titular;
        this.cpf = cpf;
        this.saldo = saldoInicial;
        this.historico = new ArrayList<>();
        if (saldoInicial > 0) {
            historico.add(new Transacao("DEPOSITO INICIAL", saldoInicial));
        }
    }

    public void depositar(double valor) {
        if (valor > 0) {
            saldo += valor;
            historico.add(new Transacao("DEPOSITO", valor));
            System.out.println("Deposito de R$" + valor + " realizado!");
        }
    }

    public boolean sacar(double valor) {
        if (valor > 0 && saldo >= valor) {
            saldo -= valor;
            historico.add(new Transacao("SAQUE", -valor));
            System.out.println("Saque de R$" + valor + " realizado!");
            return true;
        }
        System.out.println("Saldo insuficiente!");
        return false;
    }

    public boolean transferir(Conta destino, double valor) {
        if (this.sacar(valor)) {
            destino.depositar(valor);
            return true;
        }
        return false;
    }

    public void exibirExtrato() {
        System.out.println("
" + "=".repeat(50));
        System.out.println("EXTRATO - Conta " + numero);
        System.out.println("Titular: " + titular);
        System.out.println("-".repeat(50));
        for (Transacao t : historico) {
            System.out.println(t);
        }
        System.out.println("-".repeat(50));
        System.out.printf("SALDO ATUAL: R$%.2f%n", saldo);
        System.out.println("=".repeat(50));
    }

    public int getNumero() { return numero; }
    public String getTitular() { return titular; }
    public double getSaldo() { return saldo; }
}

class Transacao {
    private String tipo;
    private double valor;
    private LocalDateTime data;

    public Transacao(String tipo, double valor) {
        this.tipo = tipo;
        this.valor = valor;
        this.data = LocalDateTime.now();
    }

    @Override
    public String toString() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
        String valorStr = valor >= 0 ? "+" : "";
        return String.format("[%s] %-25s R$%s%.2f", 
            data.format(formatter), tipo, valorStr, valor);
    }
}

class Banco {
    private String nome;
    private List<Conta> contas;

    public Banco(String nome) {
        this.nome = nome;
        this.contas = new ArrayList<>();
    }

    public Conta criarConta(String titular, String cpf, double saldoInicial) {
        Conta novaConta = new Conta(titular, cpf, saldoInicial);
        contas.add(novaConta);
        System.out.println("Conta " + novaConta.getNumero() + " criada!");
        return novaConta;
    }

    public String getNome() { return nome; }
}`
};

// ============================================
// GERAR RESPOSTA BASEADA NA MENSAGEM
// ============================================

function gerarResposta(userMessage) {
    var msg = userMessage.toLowerCase();

    if (msg.indexOf('voo') !== -1 || msg.indexOf('voar') !== -1 || msg.indexOf('fly') !== -1) {
        return 'Claro! Aqui esta um sistema de voo completo para Roblox:

```lua
' + scriptsDB.voo + '
```

**Como usar:**
1. Coloque em um LocalScript dentro de StarterPlayerScripts
2. Pressione F para ativar/desativar o voo
3. Use WASD para se mover, Espaco para subir e Shift para descer

**Recursos:**
- Voo suave com BodyVelocity e BodyGyro
- Controle pela camera do jogador
- Velocidade configuravel';
    }

    if (msg.indexOf('arma') !== -1 || msg.indexOf('spawner') !== -1 || msg.indexOf('weapon') !== -1) {
        return 'Perfeito! Aqui esta um sistema de spawn de armas aleatorias para Roblox:

```lua
' + scriptsDB.arma + '
```

**Como usar:**
1. Crie uma pasta Weapons em ReplicatedStorage
2. Crie uma pasta SpawnPoints no workspace
3. Coloque o script em ServerScriptService

**Recursos:**
- Spawn automatico a cada 10 segundos
- Limite de 5 armas no mapa
- Coleta automatica ao tocar';
    }

    if (msg.indexOf('media') !== -1 || msg.indexOf('nota') !== -1 || msg.indexOf('escola') !== -1) {
        return 'Aqui esta uma calculadora de media completa em Python:

```python
' + scriptsDB.media + '
```

**Recursos:**
- Media simples e ponderada
- Relatorio completo com situacao do aluno
- Suporte a pesos diferentes
- Calculo de nota necessaria para aprovacao';
    }

    if (msg.indexOf('banco') !== -1 || msg.indexOf('bancario') !== -1 || msg.indexOf('conta') !== -1 || msg.indexOf('java') !== -1) {
        return 'Aqui esta um sistema bancario completo em Java com POO:

```java
' + scriptsDB.banco + '
```

**Classes incluidas:**
- Conta - Gerencia saldo, saques e depositos
- Transacao - Registra historico com data/hora
- Banco - Cria e gerencia multiplas contas

**Funcionalidades:**
- Deposito e saque com validacao
- Transferencia entre contas
- Extrato completo com historico';
    }

    if (msg.indexOf('roblox') !== -1 || msg.indexOf('lua') !== -1) {
        return 'Vou criar um script Lua generico para Roblox baseado no seu pedido:

```lua
-- Script Lua para Roblox
-- Gerado por AIara
-- Descricao: ' + userMessage + '

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

-- Configuracoes
local CONFIG = {
    debugMode = true,
    cooldown = 1
}

local function log(msg)
    if CONFIG.debugMode then
        print("[AIara] " .. msg)
    end
end

local function init()
    log("Inicializando script...")
    
    Players.PlayerAdded:Connect(function(player)
        log("Jogador conectado: " .. player.Name)
        
        player.CharacterAdded:Connect(function(character)
            log("Personagem carregado: " .. player.Name)
        end)
    end)
    
    log("Script carregado com sucesso!")
end

init()
```

**Como personalizar:**
1. Modifique a tabela CONFIG com seus valores
2. Adicione sua logica dentro da funcao init()
3. Use os eventos do Roblox (PlayerAdded, CharacterAdded, etc.)

Quer que eu adapte para uma funcionalidade especifica?';
    }

    if (msg.indexOf('python') !== -1) {
        return 'Aqui esta um script Python baseado no seu pedido:

```python
# Script Python
# Gerado por AIara
# Descricao: ' + userMessage + '

import os
from datetime import datetime

class AIaraScript:
    def __init__(self):
        self.nome = "Script Gerado"
        self.criado_em = datetime.now()
        self.versao = "1.0"
    
    def executar(self):
        print(f"Executando: {self.nome}")
        print(f"Criado em: {self.criado_em.strftime('%d/%m/%Y %H:%M')}")
        print("=" * 40)
        self.processar()
        print("=" * 40)
        print("Execucao concluida!")
    
    def processar(self):
        print("Processando dados...")
        # Seu codigo aqui

if __name__ == "__main__":
    script = AIaraScript()
    script.executar()
```

**Como usar:**
1. Salve como script.py
2. Execute com: python script.py
3. Personalize o metodo processar() com sua logica';
    }

    return 'Entendi seu pedido! Como sou uma IA offline com scripts pre-programados, posso gerar codigo baseado em templates.

Para melhor atende-lo, tente ser mais especifico mencionando:

- Para Roblox/Lua: "script de voo", "spawner de armas", "sistema de inventario"
- Para Python: "calculadora", "automacao", "web scraping", "jogo"
- Para Java: "sistema bancario", "cadastro", "calculadora POO"

Ou me diga exatamente o que voce quer que o script faca, e vou montar algo organizado e completo para voce!';
}

// ============================================
// INICIALIZAR HISTORICO
// ============================================

try {
    var saved = localStorage.getItem('aiara_history');
    if (saved) {
        chatHistory = JSON.parse(saved);
        carregarHistorico();
    }
} catch(e) {
    console.log('Sem historico salvo');
}

console.log('=== AIARA PRONTA ===');
