'use client'

import React, { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useTemplates } from '@/hooks/useTemplates';
import documentService from '@/services/documentService';
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
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle  
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  FileText,
  Briefcase,
  Heart,
  UserPlus,
  UserMinus,
  MoreVertical,
  Plus,
  Trash2,  
  Download,
  FilePlus2,
  Copy,
  Eye,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

// Dados de exemplo para tipos de documentos
const documentTypes = [
  { id: 1, name: "Contrato de Trabalho", icon: Briefcase },
  { id: 2, name: "Atestado Médico", icon: Heart },
  { id: 3, name: "Documento de Admissão", icon: UserPlus },
  { id: 4, name: "Documento de Demissão", icon: UserMinus },
  { id: 5, name: "Certificado", icon: FileText },
  { id: 6, name: "Outros", icon: FileText }
]

// Define the interface based on the data used and available in this component
interface DocumentTemplate {
  _id: string;
  name: string;
  description: string;
  type: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string | Date;
  // Add fields specific to this page's usage if needed
  createdFormatted?: string;
  // Note: filePath and createdBy seem missing from the source data or the imported IDocumentTemplate definition.
  // This interface reflects the actual data structure being passed to handler functions.
}

export default function ModelosDocumentosPage() {
  const {
    templates,
    loading,
    error: serviceError,
    uploadTemplate,
    deleteTemplate
  } = useTemplates();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para novo modelo
  const [newModelName, setNewModelName] = useState("");
  const [newModelType, setNewModelType] = useState("Contrato de Trabalho");
  const [newModelDescription, setNewModelDescription] = useState("");
  const [newModelFile, setNewModelFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  // Combinar erros de serviço e internos
  useEffect(() => {
    if (serviceError) {
      setError(serviceError);
    }
  }, [serviceError]);

  // Filtrar modelos com base nos filtros
  const filteredTemplates = (Array.isArray(templates) ? templates.map(t => ({ ...t, description: t.description || '' })) : []).filter(template => {
    // Filtro por texto de busca
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tipo
    const matchesType = 
      selectedType === "Todos" || template.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Para o upload de um template, use o documentService
  const handleUploadTemplate = async () => {
    if (!newModelName || !newModelType || !newModelDescription || !newModelFile) {
      setError('Por favor, preencha todos os campos obrigatórios e selecione um arquivo');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', newModelFile);
      formData.append('name', newModelName);
      formData.append('type', newModelType);
      formData.append('description', newModelDescription);
      formData.append('createdBy', 'Sistema'); // Mudar para o usuário logado quando tiver autenticação
      
      console.log('Enviando template:', {
        name: newModelName,
        type: newModelType,
        description: newModelDescription,
        file: newModelFile.name
      });
      
      await uploadTemplate(formData);
      
      setIsDialogOpen(false);
      
      // Resetar o formulário
      setNewModelName("");
      setNewModelType("Contrato de Trabalho");
      setNewModelDescription("");
      setNewModelFile(null);
      setSelectedFileName("");
      
      alert('Template enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar template:', error);
      setError('Falha ao enviar template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Para excluir um template, use o documentService
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    
    try {
      await deleteTemplate(id);
      alert('Template excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      setError('Falha ao excluir o template.');
    }
  };

  // Para visualizar um template
  const handleViewTemplate = (template: DocumentTemplate) => {
    try {
      console.log('Visualizando template:', template._id);
      documentService.viewTemplate(template._id);
    } catch (error) {
      console.error('Erro ao visualizar template:', error);
      setError('Não foi possível visualizar o template.');
    }
  };

  // Para baixar um template
  const handleDownloadTemplate = (template: DocumentTemplate) => {
    try {
      console.log('Baixando template:', template._id);
      documentService.downloadTemplate(template._id);
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      setError('Não foi possível baixar o template.');
    }
  };

  // Para duplicar um template
  const handleDuplicateTemplate = async (template: DocumentTemplate) => {
    try {
      // Busca o arquivo original do template
      const response = await fetch(`/api/templates/${template._id}/raw`);
      if (!response.ok) {
        throw new Error('Não foi possível obter o arquivo do template');
      }
      
      const fileContent = await response.blob();
      
      // Cria um arquivo com o conteúdo
      const file = new File([fileContent], template.fileName || `${template.name}.docx`, { 
        type: template.fileType || 'application/octet-stream' 
      });
      
      // Prepara os dados para o novo template
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `${template.name} (Cópia)`);
      formData.append('description', template.description);
      formData.append('type', template.type);
      formData.append('createdBy', 'Sistema');
      
      console.log('Duplicando template:', template._id);
      
      // Envia o novo template
      await uploadTemplate(formData);
      
      alert('Template duplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      setError('Falha ao duplicar o template.');
    }
  };

  // Manipulador para seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewModelFile(file);
      setSelectedFileName(file.name);
    }
  };

  // Abrir o seletor de arquivo
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função auxiliar para formatar a data
  const formatDate = (dateString?: string | Date): string => {
    if (!dateString) return '';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <AuthGuard>
      <div className="space-y-6 p-6">
        {/* Mensagens de feedback */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
            <button 
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span>&times;</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-8">
          <Link href="/dashboard/documento">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Modelos de Documentos</h1>
            <p className="text-muted-foreground">
              Gerencie os modelos de documentos da empresa
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="relative w-full md:w-80">
              <Input
                type="search"
                placeholder="Buscar modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-60">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os tipos</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Novo Modelo
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando modelos...</span>
              </div>
            ) : filteredTemplates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Criação</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const TypeIcon = documentTypes.find(t => t.name === template.type)?.icon || FileText;
                    
                    return (
                      <TableRow key={template._id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TypeIcon className="h-5 w-5" />
                            <span>{template.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{template.description}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(template.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewTemplate(template)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDownloadTemplate(template)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewTemplate(template)}>
                                  <Eye className="mr-2 h-4 w-4" /> Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadTemplate(template)}>
                                  <Download className="mr-2 h-4 w-4" /> Baixar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteTemplate(template._id)}
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
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">Nenhum modelo encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Não foi possível encontrar modelos correspondentes aos filtros aplicados. 
                  Tente ajustar seus critérios de busca ou crie um novo modelo.
                </p>
                                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Criar novo modelo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Diálogo para criar novo modelo */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Modelo de Documento</DialogTitle>
              <DialogDescription>
                Crie um novo modelo para uso nos documentos da empresa
              </DialogDescription>
            </DialogHeader>
            
            <form className="space-y-4 py-4" onSubmit={(e) => {
              e.preventDefault();
              handleUploadTemplate();
            }}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Modelo</label>
                <Input 
                  placeholder="Ex: Contrato de Trabalho Padrão" 
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Documento</label>
                <Select 
                  value={newModelType} 
                  onValueChange={setNewModelType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  placeholder="Descreva a finalidade deste modelo..."
                  value={newModelDescription}
                  onChange={(e) => setNewModelDescription(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Arquivo de Modelo</label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                  onClick={triggerFileInput}
                >
                  {selectedFileName ? (
                    <>
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm font-medium">{selectedFileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique para mudar o arquivo
                      </p>
                    </>
                  ) : (
                    <>
                      <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos suportados: DOCX, PDF (max. 5MB)
                      </p>
                    </>
                  )}
                  <Input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    accept=".docx,.pdf"
                    onChange={handleFileSelect}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Modelo'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}