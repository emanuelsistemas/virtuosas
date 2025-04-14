import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Check, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import { Toaster } from 'react-hot-toast';

interface Registration {
  id: string;
  nome_completo: string;
  cpf: string;
  verified: boolean;
}

function AdminPanel() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified'>('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchRegistrations();
  }, [filterStatus, location]);

  const fetchRegistrations = async () => {
    try {
      let query = supabase
        .from('registrations')
        .select('id, nome_completo, cpf, verified')
        .order('created_at', { ascending: false });

      if (filterStatus === 'pending') {
        query = query.eq('verified', false);
      } else if (filterStatus === 'verified') {
        query = query.eq('verified', true);
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

        <div className={`max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8`}>
          <div className="text-center mb-8">
            <h1 className="font-['Great_Vibes'] text-5xl mb-2 bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">Virtuosas</h1>
            <h2 className="font-['Playfair_Display'] text-2xl text-pink-300">Painel Administrativo</h2>
          </div>

          <div className="mb-6 flex justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'verified')}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-pink-50 text-gray-900'
              } border ${isDarkMode ? 'border-gray-600' : 'border-pink-200'} focus:outline-none focus:border-pink-400`}
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="verified">Conferidos</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-pink-100'}`}>
                    <th className="px-6 py-3 text-left">Nome Completo</th>
                    <th className="px-6 py-3 text-left">CPF</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className={`${
                        isDarkMode
                          ? 'border-b border-gray-700 hover:bg-gray-700'
                          : 'border-b border-pink-100 hover:bg-pink-50'
                      } transition-colors`}
                    >
                      <td className="px-6 py-4">{registration.nome_completo}</td>
                      <td className="px-6 py-4">{registration.cpf}</td>
                      <td className="px-6 py-4 text-center">
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
                      <td className="px-6 py-4 text-center">
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
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;