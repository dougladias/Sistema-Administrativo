"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ButtonGlitchBrightness } from "@/components/ui/ButtonGlitch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Importar o hook ao invés do api diretamente
import { useWorkers } from "@/hooks/useWorkers";
import { toast } from "react-hot-toast"; // Se não estiver usando, pode remover

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Definindo os tipos de contrato disponíveis
const contractTypes = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" }
];

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose }) => {
  // Usar hook customizado para obter o método de criação
  const { createWorker, isCreating } = useWorkers();

  // State for all required fields
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [admissao, setAdmissao] = useState("");
  const [salario, setSalario] = useState("");
  const [ajuda, setAjuda] = useState("");
  const [numero, setNumero] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState("CLT"); // Valor padrão CLT
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState(""); // Adicionado campo department
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    if (
      !name.trim() ||
      !cpf.trim() ||
      !nascimento.trim() ||
      !admissao.trim() ||
      !salario.trim() ||
      !numero.trim() ||
      !email.trim() ||
      !address.trim() ||
      !contract.trim() ||
      !role.trim()
    ) {
      if (toast && toast.error) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
      } else {
        alert("Por favor, preencha todos os campos obrigatórios");
      }
      return;
    }
    
    // Validar datas
    try {
      const nascimentoDate = new Date(nascimento);
      const admissaoDate = new Date(admissao);
      
      if (isNaN(nascimentoDate.getTime()) || isNaN(admissaoDate.getTime())) {
        if (toast && toast.error) {
          toast.error("Por favor, verifique o formato das datas");
        } else {
          alert("Por favor, verifique o formato das datas.");
        }
        return;
      }
      
      // Preparar objeto worker com datas ajustadas
      const workerToCreate = {
        name,
        cpf,
        salario,
        ajuda,
        numero,
        email,
        address,
        contract: contract as "CLT" | "PJ",
        role,
        department: department || "Geral",
        status: "active" as const,
        nascimento,
        admissao,
      };
      
      try {
        // Chamar método do hook que cuida da mutação e atualiza a cache
        await createWorker(workerToCreate);
        
        // Feedback de sucesso
        setSuccessMessage("Funcionário adicionado com sucesso!");
        toast?.success("Funcionário adicionado com sucesso!");
        
        // Limpar formulário
        setName("");
        setCpf("");
        setNascimento("");
        setAdmissao("");
        setSalario("");
        setAjuda("");
        setNumero("");
        setEmail("");
        setAddress("");
        setContract("CLT");
        setRole("");
        setDepartment("");
        
        // Fechar modal após delay
        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 2000);
      } catch (error) {
        console.error("Erro ao adicionar funcionário:", error);
        if (toast && toast.error) {
          toast.error("Erro ao adicionar funcionário");
        } else {
          alert("Erro ao adicionar funcionário");
        }
      }
    } catch (error) {
      console.error("Erro ao processar datas:", error);
      if (toast && toast.error) {
        toast.error("Erro ao processar as datas");
      } else {
        alert("Erro ao processar as datas. Verifique o formato e tente novamente.");
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const inputVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Registrar um Funcionário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            ✕
          </button>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-green-500"
          >
            {successMessage}
          </motion.div>
        )}

        {isCreating ? (
          <div className="flex flex-col items-center justify-center py-8">
            <motion.div
              className="w-12 h-12 mb-3 border-4 border-gray-500 rounded-full"
              style={{ borderTopColor: "#22d3ee" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.span
              className="text-cyan-500 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Adicionando funcionário...
            </motion.span>
          </div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4 items-left place-content-center justify-left flex flex-col"
            initial="hidden"
            animate="visible"
            variants={formVariants}
          >
            <motion.div variants={inputVariants}>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Nome:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-300">
                CPF:
              </label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={cpf}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCpf(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="nascimento" className="block text-sm font-medium text-gray-300">
                Nascimento:
              </label>
              <input
                type="date"
                id="nascimento"
                name="nascimento"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={nascimento}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNascimento(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="admissao" className="block text-sm font-medium text-gray-300">
                Admissão:
              </label>
              <input
                type="date"
                id="admissao"
                name="admissao"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={admissao}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdmissao(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="salario" className="block text-sm font-medium text-gray-300">
                Salário:
              </label>
              <input
                type="text"
                id="salario"
                name="salario"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={salario}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalario(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="ajuda" className="block text-sm font-medium text-gray-300">
                Ajuda de Custo:
              </label>
              <input
                type="text"
                id="ajuda"
                name="ajuda"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={ajuda}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAjuda(e.target.value)}
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-300">
                Número:
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={numero}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumero(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                Endereço:
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300">
                Departamento:
              </label>
              <input
                type="text"
                id="department"
                name="department"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={department}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="contract" className="block text-sm font-medium text-gray-300">
                Tipo de contrato:
              </label>
              <Select
                value={contract}
                onValueChange={setContract}
              >
                <SelectTrigger id="contract" className="bg-transparent text-white border-gray-500">
                  <SelectValue placeholder="Selecione o tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
            <motion.div variants={inputVariants}>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                Cargo:
              </label>
              <input
                type="text"
                id="role"
                name="role"
                className="text-white border rounded border-gray-500 pl-2 w-full"
                value={role}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)}
                required
              />
            </motion.div>
            <motion.div variants={inputVariants}>
              <ButtonGlitchBrightness
                text="Adicionar Funcionário"
                type="submit"
                disabled={isCreating}
                className="w-full flex text-center items-center justify-center"
              />
            </motion.div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default AddWorkerModal;