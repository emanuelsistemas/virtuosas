import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../supabase';

function RegistrationForm() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoCivil, setEstadoCivil] = useState('');
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    whatsParticipante: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    nomeContato: '',
    whatsappContato: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  const fetchRegistrationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('is_registration_closed')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setIsRegistrationClosed(data.is_registration_closed || false);
    } catch (error) {
      console.error('Error fetching registration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  };
  
  // Função para validar CPF de acordo com as regras da Receita Federal
  const isValidCPF = (cpf: string): boolean => {
    // Remover caracteres não numéricos
    const cleanCPF = cpf.replace(/[^0-9]/g, '');
    
    // Verificar se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais (CPF inválido, mas com formato correto)
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    // Verificar se os dígitos verificadores estão corretos
    return (
      parseInt(cleanCPF.charAt(9)) === digit1 && 
      parseInt(cleanCPF.charAt(10)) === digit2
    );
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .slice(0, 10);
  };

  const formatWhatsApp = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 16);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setFormData({ ...formData, [name]: formatCPF(value) });
    } else if (name === 'cep') {
      setFormData({ ...formData, [name]: formatCEP(value) });
    } else if (name === 'whatsappContato' || name === 'whatsParticipante') {
      setFormData({ ...formData, [name]: formatWhatsApp(value) });
    } else if (name === 'numero') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

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

  const getContatoLabel = () => {
    switch (estadoCivil) {
      case 'Casado':
        return 'Nome do Marido';
      case 'Namorando':
        return 'Nome do Namorado';
      case 'Outros':
        return 'Nome do Contato mais Próximo';
      default:
        return '';
    }
  };

  const resetForm = () => {
    setFormData({
      nomeCompleto: '',
      cpf: '',
      whatsParticipante: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      nomeContato: '',
      whatsappContato: ''
    });
    setEstadoCivil('');
  };

  // Verificar se o CPF já existe no banco de dados
  const checkExistingCPF = async (cpf: string): Promise<boolean> => {
    try {
      // Remove formatação do CPF, mas mantém a formatação para a consulta 
      // já que é assim que está armazenado no banco
      
      const { error, count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact' })
        .eq('cpf', cpf);
        
      if (error) throw error;
      
      return count ? count > 0 : false;
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = [
      'nomeCompleto',
      'cpf',
      'whatsParticipante',
      'cep',
      'endereco',
      'numero',
      'bairro',
      'cidade',
      'estado'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (!estadoCivil) {
      toast.error('Por favor, selecione o estado civil');
      return;
    }

    if (estadoCivil && (!formData.nomeContato || !formData.whatsappContato)) {
      toast.error('Por favor, preencha os dados de contato');
      return;
    }

    if (missingFields.length > 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    // Verificar se o CPF é válido
    if (!isValidCPF(formData.cpf)) {
      toast.error('O CPF informado não é válido. Por favor, verifique e tente novamente.');
      return;
    }
    
    // Verificar se o CPF já está cadastrado
    const cpfAlreadyExists = await checkExistingCPF(formData.cpf);
    if (cpfAlreadyExists) {
      toast.error('Este CPF já possui um cadastro no sistema. Não é permitido cadastrar o mesmo CPF mais de uma vez.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Primeiro, obter o último sequence_number para incrementar
      const { data: lastRecord, error: fetchError } = await supabase
        .from('registrations')
        .select('sequence_number')
        .order('sequence_number', { ascending: false })
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      // Calcular o próximo sequence_number
      const nextSequenceNumber = lastRecord && lastRecord.length > 0 ? lastRecord[0].sequence_number + 1 : 1;
      
      // Inserir o novo registro com o sequence_number
      const { error } = await supabase.from('registrations').insert([
        {
          nome_completo: formData.nomeCompleto,
          cpf: formData.cpf,
          whats_participante: formData.whatsParticipante,
          cep: formData.cep,
          endereco: formData.endereco,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          estado_civil: estadoCivil,
          nome_contato: formData.nomeContato,
          whatsapp_contato: formData.whatsappContato,
          sequence_number: nextSequenceNumber
        }
      ]);

      if (error) throw error;

      toast.success('Cadastro realizado com sucesso! Agradecemos seu contato.');
      resetForm();
    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao realizar cadastro. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-pink-50' : 'bg-pink-50 text-gray-900'} transition-colors duration-300`}>
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-6">
        <div className={`max-w-2xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 md:p-8 relative`}>
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-pink-300 hover:bg-gray-600' : 'bg-pink-100 text-gray-800 hover:bg-pink-200'}`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
          <div className="text-center mb-6 md:mb-8 pt-6">
            <h1 className="font-['Great_Vibes'] text-5xl sm:text-6xl mb-2 bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">Virtuosas</h1>
            <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl text-pink-300">Cadastro</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
              <p className="mt-4 text-lg">Carregando...</p>
            </div>
          ) : isRegistrationClosed ? (
            <div className="text-center py-8">
              <div className="mb-8 flex justify-center">
                <div className="p-4 rounded-full bg-red-100 inline-flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">Inscrições Encerradas</h3>
              
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-pink-50'} mb-8 max-w-lg mx-auto`}>
                <p className="text-lg mb-4">
                  Agradecemos o seu interesse, mas as inscrições para este evento já foram encerradas.
                </p>
                <p className="text-base opacity-80">
                  Entre em contato conosco para mais informações ou para ser notificado sobre futuros eventos.
                </p>
              </div>
              

            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-2">
                <input
                  type="text"
                  name="nomeCompleto"
                  placeholder="Nome Completo *"
                  className={`w-full px-4 py-3 text-base rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.nomeCompleto}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  name="cpf"
                  placeholder="CPF *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.cpf}
                  onChange={handleInputChange}
                  maxLength={14}
                  required
                />
              </div>

              <div className="col-span-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  name="whatsParticipante"
                  placeholder="Seu Telefone/WhatsApp *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.whatsParticipante}
                  onChange={handleInputChange}
                  maxLength={16}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-1 relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  name="cep"
                  placeholder="CEP *"
                  className={`w-full px-4 py-3 text-base rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400 pr-10`}
                  value={formData.cep}
                  onChange={handleInputChange}
                  maxLength={10}
                  required
                />
                <button
                  type="button"
                  onClick={searchCep}
                  disabled={isSearchingCep || formData.cep.length < 8}
                  className="absolute right-3 top-3.5 cursor-pointer"
                >
                  <Search className={`w-5 h-5 ${isSearchingCep ? 'text-gray-500' : isDarkMode ? 'text-gray-400' : 'text-pink-400'}`} />
                </button>
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  name="endereco"
                  placeholder="Endereço *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.endereco}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  name="numero"
                  placeholder="Número *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.numero}
                  onChange={handleInputChange}
                  required
                  ref={numeroInputRef}
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  name="bairro"
                  placeholder="Bairro *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.bairro}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  name="cidade"
                  placeholder="Cidade *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.cidade}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  name="estado"
                  placeholder="Estado *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.estado}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-span-2">
                <select
                  name="estadoCivil"
                  value={estadoCivil}
                  onChange={(e) => setEstadoCivil(e.target.value)}
                  className={`w-full px-4 py-3 text-base rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  required
                >
                  <option value="">Selecione o Estado Civil *</option>
                  <option value="Casado">Casado</option>
                  <option value="Namorando">Namorando</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {estadoCivil && (
                <>
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="nomeContato"
                      placeholder={`${getContatoLabel()} *`}
                      className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                      value={formData.nomeContato}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      name="whatsappContato"
                      placeholder="WhatsApp de Contato *"
                      className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                      value={formData.whatsappContato}
                      onChange={handleInputChange}
                      maxLength={16}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 sm:py-4 text-lg rounded-lg ${
                isDarkMode
                  ? 'bg-pink-500 hover:bg-pink-600 text-white'
                  : 'bg-pink-400 hover:bg-pink-500 text-white'
              } font-medium transition-colors duration-200 transform focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed mt-4`}
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>

            <div className="mt-8 text-center text-sm opacity-80">
              Desenvolvido por <a 
                href="https://emasoftware.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <span 
                  className="font-['MuseoModerno',_sans-serif] font-semibold tracking-wide inline-block animate-pulse bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent"
                >
                  ema-software
                </span>
              </a>
            </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;