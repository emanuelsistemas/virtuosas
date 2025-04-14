import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Moon, Sun, Copy, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../supabase';
import { Toaster, toast } from 'react-hot-toast';

interface Registration {
  id: string;
  nome_completo: string;
  cpf: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  estado_civil: string;
  nome_contato: string;
  whatsapp_contato: string;
  verified: boolean;
}

function RegistrationDetails() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrationDetails();
  }, [id]);

  const fetchRegistrationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRegistration(data);
    } catch (error) {
      console.error('Error fetching registration details:', error);
      toast.error('Erro ao carregar os detalhes do cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!registration) return;
    
    setIsVerifying(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ verified: true })
        .eq('id', registration.id)
        .select();

      if (error) throw error;

      setRegistration({ ...registration, verified: true });
      toast.success('Cadastro marcado como conferido!');
    } catch (error) {
      console.error('Error verifying registration:', error);
      toast.error('Erro ao marcar cadastro como conferido');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${field} copiado com sucesso!`);
  };

  const renderField = (label: string, value: string) => (
    <div className="mb-4">
      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
        {label}
      </label>
      <div className="flex items-center">
        <input
          type="text"
          readOnly
          value={value}
          className={`w-full px-4 py-2 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-pink-50'
          } border ${
            isDarkMode ? 'border-gray-600' : 'border-pink-200'
          } focus:outline-none cursor-default`}
        />
        <button
          onClick={() => copyToClipboard(value, label)}
          className={`ml-2 p-2 rounded-lg ${
            isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-pink-100 hover:bg-pink-200'
          } transition-colors`}
        >
          <Copy className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-pink-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-pink-50 text-gray-900'} p-8`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Cadastro não encontrado</h2>
          <button
            onClick={() => navigate('/admin')}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-pink-500 hover:bg-pink-600' : 'bg-pink-400 hover:bg-pink-500'
            } text-white transition-colors`}
          >
            Voltar para a lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-pink-50' : 'bg-pink-50 text-gray-900'} transition-colors duration-300`}>
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/admin')}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-pink-300' : 'bg-pink-100 text-gray-800'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
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
            <h2 className="font-['Playfair_Display'] text-2xl text-pink-300">Detalhes do Cadastro</h2>
          </div>

          <div className="space-y-6">
            {renderField('Nome Completo', registration.nome_completo)}
            {renderField('CPF', registration.cpf)}
            {renderField('CEP', registration.cep)}
            {renderField('Endereço', registration.endereco)}
            {renderField('Número', registration.numero)}
            {renderField('Bairro', registration.bairro)}
            {renderField('Cidade', registration.cidade)}
            {renderField('Estado', registration.estado)}
            {renderField('Estado Civil', registration.estado_civil)}
            {renderField('Nome do Contato', registration.nome_contato)}
            {renderField('WhatsApp do Contato', registration.whatsapp_contato)}

            {!registration.verified && (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className={`w-full py-3 mt-6 rounded-lg ${
                  isDarkMode 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-green-400 hover:bg-green-500'
                } text-white font-medium transition-colors duration-200 transform focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
              >
                <Check className="w-5 h-5 mr-2" />
                {isVerifying ? 'Conferindo...' : 'Marcar como Conferido'}
              </button>
            )}

            {registration.verified && (
              <div className="mt-6 p-4 rounded-lg bg-green-100 text-green-800 flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" />
                Cadastro já conferido
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationDetails;