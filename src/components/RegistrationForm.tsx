import React, { useState } from 'react';
import { Search, Moon, Sun } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../supabase';

function RegistrationForm() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [estadoCivil, setEstadoCivil] = useState('');
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
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

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
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
    } else if (name === 'whatsappContato') {
      setFormData({ ...formData, [name]: formatWhatsApp(value) });
    } else if (name === 'numero') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = [
      'nomeCompleto',
      'cpf',
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

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('registrations').insert([
        {
          nome_completo: formData.nomeCompleto,
          cpf: formData.cpf,
          cep: formData.cep,
          endereco: formData.endereco,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          estado_civil: estadoCivil,
          nome_contato: formData.nomeContato,
          whatsapp_contato: formData.whatsappContato
        }
      ]);

      if (error) throw error;

      toast.success('Cadastro realizado com sucesso! Agradecemos seu contato.');
      resetForm();
    } catch (error) {
      toast.error('Erro ao realizar cadastro. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-pink-50' : 'bg-pink-50 text-gray-900'} transition-colors duration-300`}>
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-pink-300' : 'bg-pink-100 text-gray-800'}`}
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        <div className={`max-w-2xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8`}>
          <div className="text-center mb-8">
            <h1 className="font-['Great_Vibes'] text-5xl mb-2 bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">Virtuosas</h1>
            <h2 className="font-['Playfair_Display'] text-2xl text-pink-300">Cadastro</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <input
                  type="text"
                  name="nomeCompleto"
                  placeholder="Nome Completo *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.nomeCompleto}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
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

              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  name="cep"
                  placeholder="CEP *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400 pr-10`}
                  value={formData.cep}
                  onChange={handleInputChange}
                  maxLength={10}
                  required
                />
                <Search className={`absolute right-3 top-2.5 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-pink-400'}`} />
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

              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="numero"
                  placeholder="Número *"
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
                  value={formData.numero}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
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

              <div>
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

              <div>
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
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 focus:bg-gray-600' : 'bg-pink-50'} border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
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
                  <div>
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
                  <div>
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
              className={`w-full py-3 rounded-lg ${
                isDarkMode 
                  ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                  : 'bg-pink-400 hover:bg-pink-500 text-white'
              } font-medium transition-colors duration-200 transform focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;