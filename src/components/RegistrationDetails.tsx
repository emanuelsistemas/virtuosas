import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Moon, Sun, Copy, ArrowLeft, Check, CreditCard, Trash2, Send } from 'lucide-react';
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
  payment_method: string | null;
}

function RegistrationDetails() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handlePaymentMethodChange = async (method: string | null) => {
    if (!registration || isUpdatingPayment) return;
    
    setIsUpdatingPayment(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ payment_method: method })
        .eq('id', registration.id);

      if (error) throw error;

      setRegistration(prev => prev ? { ...prev, payment_method: method } : null);
      toast.success(method ? `Método de pagamento atualizado para ${method}` : 'Método de pagamento removido');
    } catch (error) {
      console.error('Erro ao atualizar método de pagamento:', error);
      toast.error('Erro ao atualizar método de pagamento');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleDelete = async () => {
    if (!registration || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registration.id);

      if (error) throw error;

      toast.success('Cadastro excluído com sucesso');
      navigate('/admin');
    } catch (error) {
      console.error('Erro ao excluir cadastro:', error);
      toast.error('Erro ao excluir cadastro');
      setIsDeleting(false);
    }
  };

  const handleVerify = async () => {
    if (!registration) return;
    
    setIsVerifying(true);
    console.log('Iniciando processo de verificação para ID:', registration.id);
    
    try {
      const updateData = { verified: true };
      console.log('Dados a serem atualizados:', updateData);
      
      const { data, error } = await supabase
        .from('registrations')
        .update(updateData)
        .match({ id: registration.id })
        .select();
      
      console.log('Resposta da API:', { data, error });
      
      if (error) {
        console.error('Erro na atualização:', error);
        throw new Error(`Falha na atualização: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.error('Atualização não retornou dados');
        throw new Error('Atualização não retornou confirmação');
      }
      
      console.log('Dados após atualização:', data);
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', registration.id)
        .single();
      
      if (verifyError) {
        console.error('Erro ao verificar atualização:', verifyError);
        throw new Error(`Falha ao verificar atualização: ${verifyError.message}`);
      }
      
      console.log('Dados verificados após atualização:', verifyData);
      
      if (!verifyData.verified) {
        console.error('Verificação falhou: campo ainda é FALSE após update');
        throw new Error('A atualização não foi persistida no banco de dados');
      }
      
      setRegistration(verifyData);
      toast.success('Cadastro marcado como conferido!');
    } catch (error) {
      console.error('Erro completo:', error);
      toast.error(`Erro ao marcar cadastro como conferido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${field} copiado com sucesso!`);
  };

  const renderField = (label: string, value: string) => (
    <div className="mb-5">
      <label className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>
        {label}
      </label>
      <div className="flex items-center">
        <input
          type="text"
          readOnly
          value={value}
          className={`w-full px-4 py-3 text-base rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-pink-50'
          } border ${
            isDarkMode ? 'border-gray-600' : 'border-pink-200'
          } focus:outline-none cursor-default`}
        />
        <button
          onClick={() => copyToClipboard(value, label)}
          className={`ml-2 p-2.5 rounded-lg ${
            isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-pink-100 hover:bg-pink-200'
          } transition-colors shrink-0`}
          aria-label={`Copiar ${label}`}
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
      <div className="container mx-auto px-4 py-6">
        <div className={`max-w-2xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 md:p-8 relative`}>
          <div className="flex justify-between items-center absolute left-4 top-4 right-4 z-10">
            <button
              onClick={() => navigate('/admin')}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-pink-300 hover:bg-gray-600' : 'bg-pink-100 text-gray-800 hover:bg-pink-200'}`}
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-pink-300 hover:bg-gray-600' : 'bg-pink-100 text-gray-800 hover:bg-pink-200'}`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="text-center mb-6 md:mb-8 pt-14 sm:pt-10">
            <h1 className="font-['Great_Vibes'] text-5xl sm:text-6xl mb-2 bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">Virtuosas</h1>
            <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl text-pink-300">Detalhes do Cadastro</h2>
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

            {/* Método de Pagamento */}
            <div className="mt-6 mb-4">
              <label className={`block text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                Método de Pagamento
              </label>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handlePaymentMethodChange('Boleto')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    registration.payment_method === 'Boleto'
                      ? isDarkMode
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-400 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-pink-100 hover:bg-pink-200'
                  }`}
                  disabled={isUpdatingPayment}
                >
                  <CreditCard className="w-5 h-5" />
                  Boleto
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('Boleto Enviado')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    registration.payment_method === 'Boleto Enviado'
                      ? isDarkMode
                        ? 'bg-green-500 text-white'
                        : 'bg-green-400 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-pink-100 hover:bg-pink-200'
                  }`}
                  disabled={isUpdatingPayment}
                >
                  <Send className="w-5 h-5" />
                  Boleto Enviado
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('Cartão')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    registration.payment_method === 'Cartão'
                      ? isDarkMode
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-400 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-pink-100 hover:bg-pink-200'
                  }`}
                  disabled={isUpdatingPayment}
                >
                  <CreditCard className="w-5 h-5" />
                  Cartão
                </button>
              </div>
              {registration.payment_method && (
                <button
                  onClick={() => handlePaymentMethodChange(null)}
                  className={`mt-2 w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    isDarkMode ? 'bg-red-500 hover:bg-red-600' : 'bg-red-400 hover:bg-red-500'
                  } text-white`}
                  disabled={isUpdatingPayment}
                >
                  <Trash2 className="w-5 h-5" />
                  Remover método de pagamento
                </button>
              )}
            </div>

            {!registration.verified && (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className={`w-full py-3 sm:py-4 mt-6 rounded-lg text-lg ${
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
              <>
                <div className="mt-6 p-4 rounded-lg bg-green-100 text-green-800 flex items-center justify-center text-lg">
                  <Check className="w-6 h-6 mr-2" />
                  Cadastro já conferido
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className={`w-full py-3 sm:py-4 mt-4 rounded-lg text-lg ${
                    isDarkMode 
                      ? 'bg-pink-500 hover:bg-pink-600' 
                      : 'bg-pink-400 hover:bg-pink-500'
                  } text-white font-medium transition-colors duration-200 transform focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50 flex items-center justify-center`}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar para a lista
                </button>
              </>
            )}

            {/* Botão de Excluir Cadastro */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
                  isDarkMode ? 'bg-red-500 hover:bg-red-600' : 'bg-red-400 hover:bg-red-500'
                } text-white transition-colors`}
                disabled={isDeleting}
              >
                <Trash2 className="w-5 h-5" />
                {isDeleting ? 'Excluindo...' : 'Excluir Cadastro'}
              </button>
            </div>

            {/* Modal de Confirmação */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}>
                  <h3 className="text-xl font-semibold mb-4">Confirmar Exclusão</h3>
                  <p className="mb-6">Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={`flex-1 py-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationDetails;