'use client'

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ButtonGlitchBrightness } from "@/components/ui/ButtonGlitch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { adjustDateForTimezone } from "@/utils/date-helpers"; 

// Interface para as propriedades do modal de edição de funcionário
interface EditWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: {
    _id: string;
    name: string;
    cpf: string;
    nascimento: string;
    admissao: string;
    salario: string;
    ajuda: string;
    numero: string;
    email: string;
    address: string;
    contract: string;
    role: string;
    department: string;
    status: string;
  } | null;
  onSave: (updatedWorker: {
    _id: string;
    name: string;
    cpf: string;
    nascimento: string;
    admissao: string;
    salario: string;
    ajuda: string;
    numero: string;
    email: string;
    address: string;
    contract: string;
    role: string;
    department: string;
    status: string;
  }) => void;
}

// Tipos de contrato disponíveis
const CONTRACT_TYPES = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" }
];

// Variantes para animações
const FORM_VARIANTS = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const INPUT_VARIANTS = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

// Função para garantir que a data não vai sofrer ajuste de fuso
function ensureCorrectDateFormat(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Se já for uma data ISO completa, retorna como está
    if (dateString.includes('T')) return dateString;
    
    // Caso contrário, adiciona T12:00:00.000Z para garantir que não haverá mudança de dia
    // ao converter para timezone local
    return `${dateString}T12:00:00.000Z`;
  } catch (error) {
    console.error("Erro ao processar data:", error);
    return dateString;
  }
}

// Modal para edição de dados do funcionário
const EditWorkerModal: React.FC<EditWorkerModalProps> = ({
  isOpen,
  onClose,
  worker,
  onSave,
}) => {
  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    cpf: "",
    nascimento: "",
    admissao: "",
    salario: "",
    ajuda: "",
    numero: "",
    email: "",
    address: "",
    contract: "CLT",
    role: "",
    department: "",
    status: "active",
  });

  // Preenche o formulário apenas quando o worker mudar
  useEffect(() => {
    if (worker && isOpen) {
      setFormData({
        _id: worker._id || "",
        name: worker.name || "",
        cpf: worker.cpf || "",
        // Usa helper para garantir formato yyyy-MM-dd no input date
        nascimento: adjustDateForTimezone(worker.nascimento),
        admissao: adjustDateForTimezone(worker.admissao),
        salario: worker.salario || "",
        ajuda: worker.ajuda || "",
        numero: worker.numero || "",
        email: worker.email || "",
        address: worker.address || "",
        contract: worker.contract || "CLT",
        role: worker.role || "",
        department: worker.department || "Geral",
        status: worker.status || "active",
      });
    }
    // Só executa quando o worker._id mudar ou o modal abrir/fechar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker?._id, isOpen]);

  // Manipula alterações nos campos de input  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Manipula alterações no tipo de contrato (Select)  
  const handleContractChange = useCallback((value: string) => {
    if (value) {
      setFormData((prev) => ({ ...prev, contract: value }));
    }
  }, []);

  // Processa o envio do formulário 
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos obrigatórios
    if (!formData.name || !formData.cpf || !formData.nascimento || !formData.admissao) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      // Validação das datas
      const nascimentoDate = new Date(formData.nascimento);
      const admissaoDate = new Date(formData.admissao);

      if (isNaN(nascimentoDate.getTime()) || isNaN(admissaoDate.getTime())) {
        alert("Por favor, verifique o formato das datas.");
        return;
      }

      // Ajusta o formato das datas para prevenir problemas de fuso horário
      const updatedFormData = {
        ...formData,
        nascimento: ensureCorrectDateFormat(formData.nascimento),
        admissao: ensureCorrectDateFormat(formData.admissao)
      };

      // Salva os dados e fecha o modal
      onSave(updatedFormData);
      onClose();
    } catch (error) {
      console.error("Erro ao processar formulário:", error);
      alert("Ocorreu um erro. Verifique os dados e tente novamente.");
    }
  }, [formData, onSave, onClose]);

  // Não renderiza nada se o modal não estiver aberto ou não houver dados do funcionário
  if (!isOpen || !worker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#1F2937" }}
      >
        {/* Cabeçalho do modal */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Editar Funcionário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            ✕
          </button>
        </div>

        {/* Formulário de edição */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4 text-white"
          initial="hidden"
          animate="visible"
          variants={FORM_VARIANTS}
        >
          {/* Nome */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Nome:
            </label>
            <input
              type="text"
              className="border rounded border-gray-500 pl-2 w-full"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* CPF */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-300">
              CPF:
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Data de nascimento */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="nascimento" className="block text-sm font-medium text-gray-300">
              Nascimento:
            </label>
            <input
              type="date"
              id="nascimento"
              name="nascimento"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.nascimento}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Data de admissão */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="admissao" className="block text-sm font-medium text-gray-300">
              Admissão:
            </label>
            <input
              type="date"
              id="admissao"
              name="admissao"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.admissao}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Salário */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="salario" className="block text-sm font-medium text-gray-300">
              Salário:
            </label>
            <input
              type="text"
              id="salario"
              name="salario"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.salario}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Ajuda de custo */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="ajuda" className="block text-sm font-medium text-gray-300">
              Ajuda de Custo:
            </label>
            <input
              type="text"
              id="ajuda"
              name="ajuda"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.ajuda}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Telefone */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="numero" className="block text-sm font-medium text-gray-300">
              Número:
            </label>
            <input
              type="text"
              id="numero"
              name="numero"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Email */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Endereço */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="address" className="block text-sm font-medium text-gray-300">
              Endereço:
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="border rounded border-gray-500 pl-2 w-full"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </motion.div>

          {/* Tipo de contrato */}
          <motion.div variants={INPUT_VARIANTS}>
            <label htmlFor="contract" className="block text-sm font-medium text-gray-300">
              Tipo de contrato:
            </label>
            <Select
              value={formData.contract}
              onValueChange={handleContractChange}
            >
              <SelectTrigger id="contract" className="bg-transparent text-white border-gray-500">
                <SelectValue placeholder="Selecione o tipo de contrato" />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
            <ButtonGlitchBrightness type="submit" text="Salvar Alterações" />
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default EditWorkerModal;