'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDocuments } from '@/hooks/useDocuments'
import { useWorkers } from '@/hooks/useWorkers'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table"
import { 
  Card, 
  CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip"
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,  
  MoreVertical,
  File,
  FileImage,  
  FileArchive,
  Eye,
  Clock,
  Calendar,  
  Briefcase,
  Heart,
  UserPlus,
  UserMinus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Interface para o documento na visualização do modelo (ViewModel)
interface DocumentViewModel {
  _id: string;
  name: string;
  type: string;
  employee: string;
  employeeId: string;
  department: string;
  uploadDate: string;
  expiryDate: string;
  size: string;
  fileType: string;
  path: string;
  tags: string[];
}

// Lista de tipos de documentos
const documentTypes = [
  { id: 1, label: "Contrato de Trabalho", icon: Briefcase },
  { id: 2, label: "Atestado Médico", icon: Heart },
  { id: 3, label: "Documento de Admissão", icon: UserPlus },
  { id: 4, label: "Documento de Demissão", icon: UserMinus },
  { id: 5, label: "Certificado", icon: FileText },
  { id: 6, label: "Outros", icon: File }
]

// Departamentos
const departments = [
  "Todos",
  "TI",
  "Marketing",
  "Financeiro",
  "Vendas",
  "RH",
  "Administrativo",
  "Compliance",
  "Operações"
]

export default function DocumentosPage() {
  // Hooks para funcionários e documentos
  const { 
    documents: apiDocuments, 
    isLoading: docsLoading, 
    error: docsError,
    createDocument,
    deleteDocument,
    refetch: refetchDocuments
  } = useDocuments();
  
  const { 
    workers: employees, 
    isLoading: empLoading, 
    error: empError 
  } = useWorkers();
  
  const [mappedDocuments, setMappedDocuments] = useState<DocumentViewModel[]>([]);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [newDocument, setNewDocument] = useState({
    name: "",
    type: "",
    employee: "",
    employeeId: "",
    department: "",
    expiryDate: "",
    tags: ""
  });
  
  // Refs para evitar loops e rastrear estados
  const previousEmployeeIdRef = useRef('');
  const dataProcessedRef = useRef(false);
  const preventRecursiveUpdatesRef = useRef(false); 
  
  // MELHORIA 1: Log de dados para depuração
  useEffect(() => {
    if (apiDocuments && employees) {
      console.log(`API Documentos: ${apiDocuments.length} documentos carregados`);
      console.log(`Funcionários: ${employees.length} funcionários carregados`);
    }
  }, [apiDocuments, employees]);
  
  // Interface atualizada para documentos vindos da API
  interface ApiDocument {
    _id: string;
    name: string;               // Nome do documento (em vez de title)
    category: string;           // Categoria como "OUTROS"
    type: string;               // Tipo como "Documento de Admissão" 
    status: string;             // Status como "PENDENTE"
    employeeId: string;         // ID do funcionário (em vez de workerId)
    employee: string;           // Nome do funcionário (já vem da API)
    department: string;         // Departamento (já vem da API)
    uploadDate: string;         // Data de upload (em vez de createdAt)
    expiryDate: string;         // Data de validade (em vez de expirationDate)
    size: number;               // Tamanho em bytes
    fileType: string;           // Tipo de arquivo (em vez de mimeType)
    path: string;               // Caminho do arquivo (em vez de filePath)
    tags: string[];             // Tags do documento
    __v?: number;               // Campo do MongoDB (podemos ignorar)
  }

  // Função de mapeamento aprimorada para garantir renderização correta
  const mapDocumentsToViewModel = useCallback((docs: ApiDocument[]) => {
    if (!docs || !Array.isArray(docs)) {
      console.error("Documentos inválidos para mapeamento", { docs });
      return [];
    }
    
    try {
      return docs.map(doc => {
        if (!doc) return null;
        
        // Mapeamento direto já que a API fornece todos os dados
        const viewModel: DocumentViewModel = {
          _id: doc._id,
          name: doc.name || 'Sem título',
          type: doc.type || 'Outros',
          employee: doc.employee || 'Não atribuído',
          employeeId: doc.employeeId || '',
          department: doc.department || 'Não atribuído',
          uploadDate: doc.uploadDate 
            ? new Date(doc.uploadDate).toLocaleDateString('pt-BR') 
            : 'Data desconhecida',
          expiryDate: doc.expiryDate 
            ? new Date(doc.expiryDate).toLocaleDateString('pt-BR') 
            : 'Sem data',
          size: doc.size?.toString() || '0',
          fileType: doc.fileType || 'unknown',
          path: doc.path || '',
          tags: Array.isArray(doc.tags) ? doc.tags : []
        };
        
        return viewModel;
      }).filter(Boolean) as DocumentViewModel[];
    } catch (err) {
      console.error("Erro no mapeamento de documentos:", err);
      return [];
    }
  }, []);
  
  // MELHORIA 3: Gestão de dados separada
  useEffect(() => {
    // Verificar se temos dados e se ainda não processamos
    if (!apiDocuments || !employees) {
      return;
    }
    
    // Verificar se há qualquer dado para processar
    if (apiDocuments.length === 0) {
      console.log("Nenhum documento retornado da API");
      setMappedDocuments([]);
      return;
    }
    
    try {
      console.log("Iniciando mapeamento de documentos...");
      
      const mapped = mapDocumentsToViewModel(apiDocuments as unknown as ApiDocument[]);    
      console.log(`Mapeamento concluído: ${mapped.length} documentos processados`);
      
      // Atualizar o estado apenas se houver dados válidos
      if (mapped.length > 0) {
        setMappedDocuments(mapped);
        dataProcessedRef.current = true;
      } else if (apiDocuments.length > 0) {
        console.warn("Mapeamento produziu array vazio, mesmo com documentos API disponíveis");
      }
    } catch (err) {
      console.error("Erro ao processar documentos:", err);
      setError('Falha ao processar documentos. Tente recarregar a página.');
    }
  }, [apiDocuments, employees, mapDocumentsToViewModel]);
  
  // MELHORIA 4: Filtragem robusta
  const getFilteredDocuments = useCallback(() => {
    // Verificar se há dados para filtrar
    if (!mappedDocuments || mappedDocuments.length === 0) {
      console.log("Sem documentos para filtrar");
      return [];
    }
    
    try {
      return mappedDocuments.filter(doc => {
        // Se não temos um documento válido, pulamos
        if (!doc || typeof doc !== 'object') return false;
        
        // Filtro por texto de busca
        const matchesSearch = searchTerm === "" ? true : (
          ((doc.name || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
          ((doc.employee || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
          (Array.isArray(doc.tags) && doc.tags.some(tag => 
            tag && tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
        );
        
        // Filtro por tipo na aba atual
        const matchesTab = 
          activeTab === "todos" || 
          (activeTab === "contratos" && doc.type === "Contrato de Trabalho") ||
          (activeTab === "atestados" && doc.type === "Atestado Médico") ||
          (activeTab === "admissao" && doc.type === "Documento de Admissão") ||
          (activeTab === "demissao" && doc.type === "Documento de Demissão");
        
        // Filtro por tipo selecionado
        const matchesType = selectedType === "Todos" || doc.type === selectedType;
        
        // Filtro por departamento
        const matchesDept = selectedDepartment === "Todos" || doc.department === selectedDepartment;
        
        return matchesSearch && matchesTab && matchesType && matchesDept;
      });
    } catch (err) {
      console.error("Erro na filtragem de documentos:", err);
      return [];
    }
  }, [mappedDocuments, searchTerm, activeTab, selectedType, selectedDepartment]);
  
  // MELHORIA 5: Cálculos de paginação mais seguros (corrigido)
  const getPaginationData = useCallback(() => {
    const filteredDocs = getFilteredDocuments();
    const totalDocs = filteredDocs.length;
    const totalPages = Math.max(1, Math.ceil(totalDocs / itemsPerPage));
    
    // Ajustar página atual se necessário, mas não atualizamos o estado aqui
    // apenas retornamos o valor correto
    let safePage = currentPage;
    if (safePage > totalPages) {
      safePage = Math.max(1, totalPages);
    }
    
    const startIndex = (safePage - 1) * itemsPerPage;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + itemsPerPage);
    
    return {
      filteredDocs,
      paginatedDocs,
      totalPages,
      startIndex,
      totalItems: totalDocs,
      currentPage: safePage
    };
  }, [getFilteredDocuments, currentPage, itemsPerPage]);

  // Novo useEffect para ajustar a página atual quando necessário
  useEffect(() => {
    const { totalPages } = getPaginationData();
    
    if (currentPage > totalPages && !preventRecursiveUpdatesRef.current) {
      preventRecursiveUpdatesRef.current = true;
      
      setTimeout(() => {
        setCurrentPage(Math.max(1, totalPages));
        preventRecursiveUpdatesRef.current = false;
      }, 0);
    }
  }, [getPaginationData, currentPage]);
  
  // MELHORIA 6: Logs para depuração
  useEffect(() => {
    const paginationData = getPaginationData();
    console.log(`Documentos filtrados: ${paginationData.filteredDocs.length}, Página: ${paginationData.currentPage}/${paginationData.totalPages}`);
  }, [getPaginationData]);
  
  // Função para obter o ícone do tipo de arquivo
  const getFileIcon = useCallback((fileType: string) => {
    switch(String(fileType).toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'png':
      case 'jpeg':
        return <FileImage className="h-5 w-5 text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-700" />;
      case 'zip':
      case 'rar':
        return <FileArchive className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  }, []);
  
  // Função para obter o ícone do tipo de documento
  const getDocTypeIcon = useCallback((docType: string) => {
    const type = documentTypes.find(t => t.label === docType);
    return type ? type.icon : File;
  }, []);
  
  // Função para visualizar documento
  const handleViewDocument = useCallback((doc: DocumentViewModel) => {
    try {
      window.open(`/api/documents/download/${doc._id}`, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar documento:', error);
      setError('Não foi possível visualizar o documento.');
    }
  }, []);
  
  // Função para baixar documento
  const handleDownloadDocument = useCallback((doc: DocumentViewModel) => {
    try {
      window.open(`/api/documents/download/${doc._id}?download=true`, '_blank');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      setError('Não foi possível baixar o documento.');
    }
  }, []);
  
  // Função para excluir documento usando o hook
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
  
    try {
      await deleteDocument(docId);
      
      // Dar tempo para a API processar
      setTimeout(async () => {
        await refetchDocuments();
        
        // Opcional: remover o documento da lista local
        setMappedDocuments(prev => prev.filter(doc => doc._id !== docId));
      }, 500);
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      setError('Falha ao excluir o documento.');
    }
  };
  
  // Função de manipulação de campos do formulário
  const handleFormChange = useCallback((field: string, value: string) => {
    setNewDocument(prev => ({...prev, [field]: value}));
  }, []);
  
  // Função para seleção de funcionário
  const handleEmployeeSelect = useCallback((employeeId: string) => {
    if (!employeeId || employeeId === previousEmployeeIdRef.current) return;
    
    previousEmployeeIdRef.current = employeeId;
    
    const employee = employees?.find(emp => emp._id === employeeId);
    if (employee) {
      setNewDocument(prev => ({
        ...prev,
        employeeId,
        employee: employee.name,
        department: employee.department || prev.department
      }));
    }
  }, [employees]);
  
  // MELHORIA 7: Upload de documento aprimorado
  const handleUploadDocument = async () => {
    if (!selectedFile || !newDocument.type || !newDocument.employeeId) {
      setError('Por favor, preencha todos os campos obrigatórios e selecione um arquivo.');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      console.log("Iniciando upload do documento...");
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Campos básicos
      formData.append('title', newDocument.name || selectedFile.name);
      formData.append('category', 'OUTROS'); 
      formData.append('workerId', newDocument.employeeId);
      
      // Descrição
      formData.append('description', `Documento do tipo: ${newDocument.type}`);
      
      // Departamento (se disponível)
      if (newDocument.department) {
        formData.append('departmentId', newDocument.department);
      }
      
      // Data de expiração - CUIDADO: envie como string, não como Date
      if (newDocument.expiryDate) {
        formData.append('expirationDate', newDocument.expiryDate);
      }
      
      // CORREÇÃO PARA O PROBLEMA DE ARRAYS:
      // Envie tags como uma string - o backend deve fazer o parsing
      if (newDocument.tags && newDocument.tags.trim()) {
        // Envie como string simples, não como JSON
        formData.append('tags', newDocument.tags);
      }
      
      // Log para debug
      console.log("Estrutura do FormData a ser enviado:");
      for (const [key, value] of formData.entries()) {
        // Verificação segura se é um arquivo - evitando o uso direto de instanceof
        const isFile = value && 
          typeof value === 'object' && 
          'name' in value &&
          'size' in value &&
          'type' in value;
          
        console.log(`${key}: ${isFile ? (value as File).name : value}`);
      }
      
      const response = await createDocument(formData);
      console.log("Resposta do createDocument:", response);
      
      // O restante do código permanece igual
      setUploadDialogOpen(false);
      
      setTimeout(async () => {
        console.log("Atualizando lista de documentos...");
        await refetchDocuments();
        resetForm();
        
        alert('Documento enviado com sucesso!');
      }, 1000);
    } catch (error: unknown) {
      console.error('Erro ao enviar documento:', error);

      // Melhor tratamento de erro para não deslogar usuário
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: unknown }).response
      ) {
        const err = error as { response: { status: number; data?: { message?: string } } };
        console.error('Detalhes da resposta:', err.response.data);
        setError(`Erro ${err.response.status}: ${err.response.data?.message || 'Falha ao processar solicitação'}`);
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'request' in error &&
        (error as { request?: unknown }).request
      ) {
        setError('O servidor não respondeu. Verifique sua conexão de internet.');
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error
      ) {
        setError(`Falha ao enviar o documento: ${(error as { message: string }).message}`);
      } else {
        setError('Falha ao enviar o documento: erro desconhecido.');
      }

      // NÃO fechar o diálogo em caso de erro
    } finally {
      setUploading(false);
    }
  };
  
  // Formatação de tamanho de arquivo
  const formatFileSize = useCallback((bytes: number | string) => {
    const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(size)) return '0 bytes';
    
    if (size < 1024) return size + ' bytes';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);
  
  // Reset do formulário
  const resetForm = () => {
    setSelectedFile(null);
    setNewDocument({
      name: "",
      type: "",
      employee: "",
      employeeId: "",
      department: "",
      expiryDate: "",
      tags: ""
    });
  };
  
  // Manipulador de diálogo
  const handleDialogOpenChange = (open: boolean) => {
    if (preventRecursiveUpdatesRef.current) return;
    
    preventRecursiveUpdatesRef.current = true;
    
    setUploadDialogOpen(open);
    if (!open) {
      resetForm();
    }
    
    setTimeout(() => {
      preventRecursiveUpdatesRef.current = false;
    }, 0);
  };
  
  // Manipuladores de filtros
  const handleTabChange = (value: string) => {
    if (preventRecursiveUpdatesRef.current) return;
    
    preventRecursiveUpdatesRef.current = true;
    setActiveTab(value);
    
    setTimeout(() => {
      preventRecursiveUpdatesRef.current = false;
    }, 0);
  };
  
  const handleTypeChange = (value: string) => {
    if (preventRecursiveUpdatesRef.current) return;
    
    preventRecursiveUpdatesRef.current = true;
    setSelectedType(value);
    
    setTimeout(() => {
      preventRecursiveUpdatesRef.current = false;
    }, 0);
  };
  
  const handleDepartmentChange = (value: string) => {
    if (preventRecursiveUpdatesRef.current) return;
    
    preventRecursiveUpdatesRef.current = true;
    setSelectedDepartment(value);
    
    setTimeout(() => {
      preventRecursiveUpdatesRef.current = false;
    }, 0);
  };
  
  // Estado de carregamento geral
  const loading = docsLoading || empLoading;
  
  // Combinar erros dos hooks
  useEffect(() => {
    if (docsError) setError(docsError);
    if (empError) setError(empError instanceof Error ? empError.message : String(empError));
  }, [docsError, empError]);
  
  // Força render após carregamento
  useEffect(() => {
    if (!loading && dataProcessedRef.current && mappedDocuments.length === 0 && apiDocuments && apiDocuments.length > 0) {
      console.log("Forçando remapeamento de documentos...");
      const mapped = mapDocumentsToViewModel(apiDocuments as unknown as ApiDocument[]);
      setMappedDocuments(mapped);
    }
  }, [loading, apiDocuments, mappedDocuments, mapDocumentsToViewModel]);
  
  // Computar paginação para a renderização
  const paginationData = getPaginationData();

  return (
    <div className="space-y-6 p-6">
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
          <button 
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <span>&times;</span>
          </button>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Documentos</h1>
          <p className="text-muted-foreground">
            Armazene e gerencie documentos importantes da empresa
          </p>
        </div>
        <Button onClick={() => handleDialogOpenChange(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Enviar Documento
        </Button>
      </div>

      {/* MELHORIA 9: Tabs com defaultValue */}
      <Tabs defaultValue="todos" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="atestados">Atestados</TabsTrigger>
          <TabsTrigger value="admissao">Admissão</TabsTrigger>
          <TabsTrigger value="demissao">Demissão</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar documentos..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* MELHORIA 10: Selects nativos */}
              <div className="w-full md:w-72">
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="Todos">Todos os tipos</option>
                  {documentTypes.map(type => (
                    <option key={`type-${type.id}`} value={type.label}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-full md:w-64">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  {departments.map((dept, index) => (
                    <option key={`dept-${index}`} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent"></div>
                </div>
              ) : paginationData.paginatedDocs.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginationData.paginatedDocs.map((doc) => {
                        const DocTypeIcon = getDocTypeIcon(doc.type);
                        
                        return (
                          <TableRow key={doc._id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getFileIcon(doc.fileType)}
                                <span className="font-medium">{doc.name}</span>
                              </div>
                              <div className="flex mt-1 space-x-1">
                                {doc.tags && doc.tags.map((tag, tagIndex) => (
                                  <span 
                                    key={`tag-${doc._id}-${tagIndex}`}
                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {formatFileSize(doc.size)}
                              </div>
                            </TableCell>
                            <TableCell>{doc.employee}</TableCell>
                            <TableCell>{doc.department}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <DocTypeIcon className="h-4 w-4" />
                                <span>{doc.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{doc.uploadDate}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{doc.expiryDate}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleViewDocument(doc)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Visualizar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleDownloadDocument(doc)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Baixar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                      <Eye className="mr-2 h-4 w-4" /> Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                      <Download className="mr-2 h-4 w-4" /> Baixar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleDeleteDocument(doc._id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {paginationData.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                        Mostrando {paginationData.startIndex + 1} a {Math.min(paginationData.startIndex + itemsPerPage, paginationData.totalItems)} de {paginationData.totalItems} documentos
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={paginationData.currentPage === 1}
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        
                        {/* Lógica para exibir botões de páginas */}
                        {(() => {
                          const buttons = [];
                          const totalPages = paginationData.totalPages;
                          let startPage = 1;
                          let endPage = totalPages;
                          
                          // Limitar o número de botões de página exibidos
                          if (totalPages > 5) {
                            if (paginationData.currentPage <= 3) {
                              endPage = 5;
                            } else if (paginationData.currentPage >= totalPages - 2) {
                              startPage = totalPages - 4;
                            } else {
                              startPage = paginationData.currentPage - 2;
                              endPage = paginationData.currentPage + 2;
                            }
                          }
                          
                          // Adicionar botão de primeira página se necessário
                          if (startPage > 1) {
                            buttons.push(
                              <Button
                                key="page-1"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                className="h-8 w-8 p-0"
                              >
                                1
                              </Button>
                            );
                            
                            if (startPage > 2) {
                              buttons.push(
                                <div key="ellipsis-1" className="px-2 py-1">...</div>
                              );
                            }
                          }
                          
                          // Adicionar botões de páginas
                          for (let i = startPage; i <= endPage; i++) {
                            buttons.push(
                              <Button
                                key={`page-${i}`}
                                variant={paginationData.currentPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(i)}
                                className="h-8 w-8 p-0"
                              >
                                {i}
                              </Button>
                            );
                          }
                          
                          // Adicionar botão de última página se necessário
                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              buttons.push(
                                <div key="ellipsis-2" className="px-2 py-1">...</div>
                              );
                            }
                            
                            buttons.push(
                              <Button
                                key={`page-${totalPages}`}
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                className="h-8 w-8 p-0"
                              >
                                {totalPages}
                              </Button>
                            );
                          }
                          
                          return buttons;
                        })()}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages))}
                          disabled={paginationData.currentPage === paginationData.totalPages}
                          className="h-8 px-2"
                        >
                          Próximo
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    {mappedDocuments.length > 0 
                      ? 'Não foi possível encontrar documentos correspondentes aos filtros aplicados. Tente ajustar seus critérios de busca.' 
                      : 'Não há documentos disponíveis. Adicione um novo documento para começar.'}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleDialogOpenChange(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar novo documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* MELHORIA 11: Diálogo de Upload com formulário nativo */}
      <Dialog 
        open={uploadDialogOpen} 
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Novo Documento</DialogTitle>
            <DialogDescription>
              Preencha as informações e selecione o arquivo para upload
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">Arquivo</label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => document.getElementById('file')?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-muted-foreground">
                  {selectedFile 
                    ? selectedFile.name 
                    : "Arraste um arquivo ou clique para selecionar"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos suportados: PDF, DOCX, JPG, PNG (max. 10MB)
                </p>
                <Input 
                  id="file" 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="doc-type" className="text-sm font-medium">Tipo de Documento</label>
              <select
                id="doc-type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newDocument.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
              >
                <option value="" disabled>Selecione o tipo</option>
                {documentTypes.map(type => (
                  <option key={`modal-type-${type.id}`} value={type.label}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="employee" className="text-sm font-medium">Funcionário</label>
              <select
                id="employee"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newDocument.employeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
              >
                <option value="" disabled>Selecione o funcionário</option>
                {Array.isArray(employees) ? employees.map(employee => (
                  <option 
                    key={`modal-employee-${employee._id || 'unknown'}`} 
                    value={String(employee._id || '')} 
                  >
                    {employee.name}
                  </option>
                )) : null}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">Departamento</label>
                <select
                  id="department"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newDocument.department}
                  onChange={(e) => handleFormChange('department', e.target.value)}
                >
                  <option value="" disabled>Departamento</option>
                  {departments.slice(1).map((dept, index) => (
                    <option key={`modal-dept-${index}`} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="expiry" className="text-sm font-medium">Data de Validade</label>
                <Input 
                  id="expiry" 
                  type="date" 
                  value={newDocument.expiryDate}
                  onChange={(e) => handleFormChange('expiryDate', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">Tags (separadas por vírgula)</label>
              <Input 
                id="tags" 
                placeholder="ex: contrato, permanente" 
                value={newDocument.tags}
                onChange={(e) => handleFormChange('tags', e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadDocument}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Documento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}