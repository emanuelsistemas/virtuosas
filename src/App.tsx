import { Routes, Route } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import RegistrationDetails from './components/RegistrationDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RegistrationForm />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/registration/:id" element={<RegistrationDetails />} />
    </Routes>
  );
}

export default App;