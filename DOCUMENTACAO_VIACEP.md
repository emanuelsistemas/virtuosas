# Documentação da Integração da API ViaCEP

## Visão Geral

Esta documentação detalha a implementação da integração da API ViaCEP no formulário de cadastro da aplicação Virtuosas. A integração permite que, ao inserir um CEP e clicar no ícone de lupa, os campos de endereço sejam preenchidos automaticamente com os dados obtidos da API ViaCEP.

## Funcionalidades Implementadas

1. **Consulta de CEP**: Ao clicar no ícone de lupa ao lado do campo CEP, o sistema consulta a API ViaCEP para obter os dados de endereço.
2. **Preenchimento Automático**: Os campos de endereço (logradouro, bairro, cidade e estado) são preenchidos automaticamente com os dados retornados pela API.
3. **Foco Automático**: Após o preenchimento dos campos, o cursor é posicionado automaticamente no campo "Número" para facilitar a continuação do preenchimento.
4. **Tratamento de Erros**: Mensagens de erro são exibidas caso o CEP não seja encontrado ou ocorra algum problema na consulta.
5. **Compatibilidade com Máscara**: O sistema lida com a máscara de CEP no formato `xx.xxx-xxx`, convertendo-a para o formato esperado pela API.
6. **Responsividade Mobile**: O formulário foi adaptado para garantir uma boa experiência em dispositivos móveis.

## Detalhes Técnicos da Implementação

### 1. Estrutura do Componente

O componente `RegistrationForm.tsx` foi modificado para incluir:

- Estado para controlar quando uma busca de CEP está em andamento: `isSearchingCep`
- Referência para o campo de número: `numeroInputRef`
- Função para buscar o CEP na API ViaCEP: `searchCep`
- Botão de busca associado ao campo CEP

### 2. Função de Busca de CEP

```typescript
const searchCep = async () => {
  if (formData.cep.length < 8) {
    toast.error('Por favor, digite um CEP válido');
    return;
  }

  setIsSearchingCep(true);

  try {
    // Remove non-numeric characters and format as expected by the API
    const cepNumbers = formData.cep.replace(/\D/g, '');
    
    // Check if we have enough digits
    if (cepNumbers.length !== 8) {
      toast.error('CEP deve conter 8 dígitos');
      return;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
    const data = await response.json();

    if (data.erro) {
      toast.error('CEP não encontrado');
      return;
    }

    // Update form with address data
    setFormData(prev => ({
      ...prev,
      endereco: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf
    }));

    // Focus on the número field
    setTimeout(() => {
      if (numeroInputRef.current) {
        numeroInputRef.current.focus();
      }
    }, 100);

    toast.success('Endereço preenchido com sucesso');
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    toast.error('Erro ao buscar CEP. Verifique sua conexão.');
  } finally {
    setIsSearchingCep(false);
  }
};
```

### 3. Tratamento da Máscara de CEP

O CEP inserido pelo usuário é formatado com a máscara `xx.xxx-xxx` através da função `formatCEP`:

```typescript
const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2')
    .slice(0, 10);
};
```

Antes de enviar para a API, a função `searchCep` remove todos os caracteres não numéricos para obter apenas os 8 dígitos do CEP:

```typescript
const cepNumbers = formData.cep.replace(/\D/g, '');
```

### 4. Interface com a API ViaCEP

A API ViaCEP é acessada através de uma requisição fetch para a URL:

```
https://viacep.com.br/ws/${cepNumbers}/json/
```

Onde `${cepNumbers}` é o CEP sem formatação (apenas os 8 dígitos).

A resposta da API é um objeto JSON com os seguintes campos principais:
- `logradouro`: Nome da rua, avenida, etc.
- `bairro`: Nome do bairro
- `localidade`: Nome da cidade
- `uf`: Sigla do estado
- `erro`: Presente e com valor `true` quando o CEP não é encontrado

### 5. Preenchimento dos Campos e Foco Automático

Após receber a resposta da API, os campos são preenchidos automaticamente:

```typescript
setFormData(prev => ({
  ...prev,
  endereco: data.logradouro,
  bairro: data.bairro,
  cidade: data.localidade,
  estado: data.uf
}));
```

Em seguida, o cursor é posicionado no campo "Número" usando uma referência React e um pequeno timeout para garantir que o DOM tenha sido atualizado:

```typescript
setTimeout(() => {
  if (numeroInputRef.current) {
    numeroInputRef.current.focus();
  }
}, 100);
```

### 6. Tratamento de Erros

A implementação inclui tratamento para diferentes cenários de erro:

- CEP com menos de 8 dígitos: Exibe mensagem "Por favor, digite um CEP válido"
- CEP não encontrado na API: Exibe mensagem "CEP não encontrado"
- Erro na requisição: Exibe mensagem "Erro ao buscar CEP. Verifique sua conexão."

### 7. Melhorias de Responsividade

O formulário foi adaptado para melhor visualização em dispositivos móveis:

- Alteração do grid para empilhar campos em telas pequenas
- Ajuste de espaçamento e padding para melhor visualização
- Adaptação do tamanho dos elementos para telas menores

## Como Testar

1. Abra o formulário de cadastro
2. Digite um CEP válido no campo CEP (ex: 01001-000)
3. Clique no ícone de lupa ao lado do campo
4. Observe o preenchimento automático dos campos de endereço
5. Verifique que o cursor é posicionado no campo "Número"

## Limitações e Considerações

- A API ViaCEP só funciona com CEPs brasileiros
- Alguns CEPs podem não retornar todos os dados (ex: logradouro ou bairro)
- É necessária uma conexão com a internet para o funcionamento da consulta
- A API tem limites de requisições, embora sejam bastante generosos para uso normal

## Referências

- [Documentação oficial da API ViaCEP](https://viacep.com.br/)
- [React useRef Hook](https://reactjs.org/docs/hooks-reference.html#useref)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)