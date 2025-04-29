import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Check, Clock, Users, CreditCard, Send } from 'lucide-react';
import { supabase } from '../supabase';
import { Toaster } from 'react-hot-toast';

interface Registration {
  id: string;
  nome_completo: string;
  cpf: string;
  whats_participante: string | null;
  verified: boolean;
  created_at: string;
  sequence_number: number;
  payment_method: string | null;
}

function AdminPanel() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'boleto' | 'cartao' | 'boleto-enviado'>(() => {
    // Recuperar filtro salvo do localStorage, se existir
    const savedFilter = localStorage.getItem('adminPanelFilter');
    return savedFilter ? savedFilter as 'all' | 'pending' | 'verified' | 'boleto' | 'cartao' | 'boleto-enviado' : 'all';
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchRegistrations();
    fetchTotalRegistrationsCount();
    fetchRegistrationStatus();
  }, [filterStatus, location]);

  // Save filter status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminPanelFilter', filterStatus);
  }, [filterStatus]);

  const fetchRegistrationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('is_registration_closed')
        .single();

      if (error) {
        // Se o erro for de tabela ou vista não existente, a criaremos
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.log('Tabela settings não existe, tentando criar...');
          await createSettingsTable();
          return;
        } else {
          throw error;
        }
      }
      
      if (data) setIsRegistrationClosed(data.is_registration_closed || false);
    } catch (error) {
      console.error('Error fetching registration status:', error);
      toast.error('Erro ao verificar status de inscrições');
    }
  };

  const createSettingsTable = async () => {
    try {
      // Primeiro tentamos criar a tabela settings se ela não existir
      const { error: createError } = await supabase
        .from('settings')
        .insert([{ id: 1, is_registration_closed: false }]);

      if (!createError) {
        setIsRegistrationClosed(false);
        toast.success('Configurações inicializadas com sucesso');
      } else {
        console.error('Erro ao criar tabela settings:', createError);
        toast.error('Erro ao criar configurações');
      }
    } catch (error) {
      console.error('Erro ao criar tabela settings:', error);
    }
  };

  const toggleRegistrationStatus = async () => {
    try {
      // Mostrar feedback visual de carregamento
      toast.loading('Atualizando status das inscrições...');
      
      const newStatus = !isRegistrationClosed;
      
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, is_registration_closed: newStatus }, { onConflict: 'id' });

      if (error) {
        // Se a tabela não existir, tentamos criá-la e repetir
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          await createSettingsTable();
          return toggleRegistrationStatus(); // tentar novamente
        }
        throw error;
      }
      
      // Atualizando estado na interface e mostrando mensagem de sucesso
      setIsRegistrationClosed(newStatus);
      toast.dismiss();
      toast.success(`Inscrições ${newStatus ? 'encerradas' : 'abertas'} com sucesso!`);
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast.dismiss();
      toast.error('Erro ao atualizar status das inscrições');
    }
  };

  const fetchTotalRegistrationsCount = async () => {
    try {
      let query = supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });
      
      // Aplicar o mesmo filtro usado em fetchRegistrations
      if (filterStatus === 'pending') {
        query = query.eq('verified', false);
      } else if (filterStatus === 'verified') {
        query = query.eq('verified', true);
      } else if (filterStatus === 'boleto') {
        query = query.eq('payment_method', 'Boleto');
      } else if (filterStatus === 'cartao') {
        query = query.eq('payment_method', 'Cartão');
      } else if (filterStatus === 'boleto-enviado') {
        query = query.eq('payment_method', 'Boleto Enviado');
      }

      const { error, count } = await query;

      if (error) throw error;
      setTotalRegistrations(count || 0);
    } catch (error) {
      console.error('Error fetching total registrations count:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      let query = supabase
        .from('registrations')
        .select('id, nome_completo, cpf, whats_participante, verified, created_at, sequence_number, payment_method')
        .order('created_at', { ascending: false });

      if (filterStatus === 'pending') {
        query = query.eq('verified', false);
      } else if (filterStatus === 'verified') {
        query = query.eq('verified', true);
      } else if (filterStatus === 'boleto') {
        query = query.eq('payment_method', 'Boleto');
      } else if (filterStatus === 'cartao') {
        query = query.eq('payment_method', 'Cartão');
      } else if (filterStatus === 'boleto-enviado') {
        query = query.eq('payment_method', 'Boleto Enviado');
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodTag = (method: string | null) => {
    if (!method) return <span className="text-gray-400">-</span>;

    const isBoletoPending = method === 'Boleto';
    const isBoletoSent = method === 'Boleto Enviado';
    const isCard = method === 'Cartão';

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full ${
        isBoletoSent
          ? 'bg-green-100 text-green-800'
          : isBoletoPending
          ? 'bg-yellow-100 text-yellow-800'
          : isCard
          ? 'bg-blue-100 text-blue-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isBoletoSent ? (
          <Send className="w-4 h-4 mr-1" />
        ) : (
          <CreditCard className="w-4 h-4 mr-1" />
        )}
        {method}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-pink-50' : 'bg-pink-50 text-gray-900'} transition-colors duration-300`}>
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-6">
        <div className={`max-w-full mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-4 sm:p-6 md:p-8 relative`}>
          <div className="absolute right-4 top-4 z-10">
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
            <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl text-pink-300">Painel Administrativo</h2>
          </div>

          {/* Contador de Cadastros */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-pink-100'} flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center">
              <Users className="w-6 h-6 mr-2 text-pink-400" />
              <div>
                <span className="text-lg font-semibold">
                  {filterStatus === 'all' && 'Total de Cadastros'}
                  {filterStatus === 'pending' && 'Total de Pendentes'}
                  {filterStatus === 'verified' && 'Total de Conferidos'}
                  {filterStatus === 'boleto' && 'Total de Boleto'}
                  {filterStatus === 'cartao' && 'Total de Cartão'}
                  {filterStatus === 'boleto-enviado' && 'Total de Boleto Enviado'}
                  : {totalRegistrations}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <button 
                  onClick={toggleRegistrationStatus} 
                  className={`flex items-center px-4 py-2 rounded-lg ${isRegistrationClosed ? 
                    (isDarkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white') : 
                    (isDarkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white')
                  } transition-colors`}
                >
                  <span className="font-medium">
                    Inscrições {isRegistrationClosed ? 'Encerradas' : 'Abertas'}
                  </span>
                  <div className="relative ml-2 w-10 h-5 bg-gray-200 rounded-full">
                    <div 
                      className={`absolute top-0.5 ${isRegistrationClosed ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full shadow transition-all`}
                    />
                  </div>
                </button>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  const newFilterStatus = e.target.value as typeof filterStatus;
                  // Salvar o filtro no localStorage
                  localStorage.setItem('adminPanelFilter', newFilterStatus);
                  setFilterStatus(newFilterStatus);
                }}
                className={`px-4 py-2 text-base rounded-lg ${
                  isDarkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                } border ${isDarkMode ? 'border-gray-500' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="verified">Conferidos</option>
                <option value="boleto">Boleto</option>
                <option value="boleto-enviado">Boleto Enviado</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Table for medium and large screens */}
              <div className="hidden md:block overflow-x-auto rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-pink-100'}`}>
                      <th className="px-4 py-3 text-left w-16">#</th>
                      <th className="px-4 py-3 text-left">Nome Completo</th>
                      <th className="px-4 py-3 text-left">CPF</th>
                      <th className="px-4 py-3 text-left">WhatsApp</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Pagamento</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration, index) => (
                      <tr
                        key={registration.id}
                        className={`${
                          isDarkMode
                            ? 'border-b border-gray-700 hover:bg-gray-700'
                            : 'border-b border-pink-100 hover:bg-pink-50'
                        } transition-colors`}
                      >
                        <td className="px-4 py-4 font-medium">{registrations.length - index}</td>
                        <td className="px-4 py-4">{registration.nome_completo}</td>
                        <td className="px-4 py-4">{registration.cpf}</td>
                        <td className="px-4 py-4">{registration.whats_participante || '-'}</td>
                        <td className="px-4 py-4 text-center">
                          {registration.verified ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                              <Check className="w-4 h-4 mr-1" />
                              Conferido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              <Clock className="w-4 h-4 mr-1" />
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getPaymentMethodTag(registration.payment_method)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => navigate(`/admin/registration/${registration.id}`)}
                            className={`px-4 py-2 rounded-lg ${
                              isDarkMode
                                ? 'bg-pink-500 hover:bg-pink-600'
                                : 'bg-pink-400 hover:bg-pink-500'
                            } text-white transition-colors`}
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Card layout for small screens */}
              <div className="md:hidden space-y-4">
                {registrations.map((registration, index) => (
                  <div 
                    key={registration.id} 
                    className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-pink-50'} shadow-sm relative`}
                  >
                    <div className="mb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="font-medium mr-2 text-pink-400">#{registrations.length - index}</span>
                          <h3 className="font-semibold text-lg">{registration.nome_completo}</h3>
                        </div>
                        {registration.created_at && (
                          <p className={`text-xs italic ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(registration.created_at).toLocaleString('pt-BR', {
                              timeZone: 'America/Sao_Paulo',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <p className="text-sm opacity-80">{registration.cpf}</p>
                      <p className="text-sm opacity-80">WhatsApp: {registration.whats_participante || '-'}</p>
                      <div className="mt-2 space-y-2">
                        {registration.payment_method && (
                          <div className="flex items-center">
                            {getPaymentMethodTag(registration.payment_method)}
                          </div>
                        )}
                        <div>
                          {registration.verified ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                              <Check className="w-4 h-4 mr-1" />
                              Conferido
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                              <Clock className="w-4 h-4 mr-1" />
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/admin/registration/${registration.id}`)}
                        className={`w-full py-2 rounded-lg ${
                          isDarkMode
                            ? 'bg-pink-500 hover:bg-pink-600'
                            : 'bg-pink-400 hover:bg-pink-500'
                        } text-white transition-colors text-sm`}
                      >
                        Visualizar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;