'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Banknote,
  Gift,
  ReceiptText,
  ArrowRight,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import payrollService from '@/services/payrollService'

export default function FolhaSalarialPage() {
  // Obter o mês e ano atuais
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  // Consulta para obter dados da folha do mês atual
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['payroll', currentMonth, currentYear],
    queryFn: async () => {
      try {
        const response = await payrollService.getPayrollsByMonthYear(currentMonth, currentYear)
        return response.data
      } catch (error) {
        console.error('Erro ao carregar folha de pagamento:', error)
        return { payrolls: [] }
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutos
  })

  // Cálculos para estatísticas
  const totalEmployees = payrollData?.payrolls?.length || 0
  const totalPayroll: number = payrollData?.payrolls?.reduce((acc: number, item: { totalSalary: number }) => acc + item.totalSalary, 0) || 0
  // Define an interface for the structure of items within the payrolls array
  interface PayrollItem {
    totalSalary: number;
    deductions: number;
    // Add other properties of a payroll item if known
  }
  
  // Assuming payrollData.payrolls is an array of PayrollItem or undefined
  const totalDeductions: number = payrollData?.payrolls?.reduce(
    (acc: number, item: PayrollItem) => acc + item.deductions, 
    0 // Initial value for the accumulator
  ) || 0;
  
  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)
  }

  // Obtendo o nome do mês atual
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const currentMonthName = monthNames[currentMonth - 1]

  // Módulos da folha salarial
  const modules = [
    {
      title: 'Pagamentos',
      description: 'Gerencie a folha de pagamento mensal e processamento de salários',
      icon: Banknote,
      href: '/Dashboard/folha-salarial/pagamento',
      color: 'text-green-500 bg-green-100 dark:bg-green-800/30 dark:text-green-300'
    },
    {
      title: 'Benefícios',
      description: 'Configure e gerencie os benefícios oferecidos aos funcionários',
      icon: Gift,
      href: '/Dashboard/folha-salarial/beneficio',
      color: 'text-blue-500 bg-blue-100 dark:bg-blue-800/30 dark:text-blue-300'
    },
    {
      title: 'Holerites',
      description: 'Gere e visualize holerites individuais para os funcionários',
      icon: ReceiptText,
      href: '/Dashboard/folha-salarial/holerite',
      color: 'text-purple-500 bg-purple-100 dark:bg-purple-800/30 dark:text-purple-300'
    },
    {
      title: 'Relatórios',
      description: 'Visualize relatórios detalhados e análises financeiras',
      icon: FileText,
      href: '/Dashboard/folha-salarial/relatorio',
      color: 'text-amber-500 bg-amber-100 dark:bg-amber-800/30 dark:text-amber-300'
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Folha Salarial</h1>
          <p className="text-muted-foreground">
            Gerencie a folha de pagamento e benefícios dos funcionários
          </p>
        </div>
      </div>

      {/* Resumo da folha atual */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-cyan-500" />
            Folha de {currentMonthName}/{currentYear}
          </h2>
          <Link href="/Dashboard/folha-salarial/pagamento">
            <Button variant="outline" size="sm" className="flex items-center">
              Ver Detalhes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="mr-2 h-4 w-4 text-cyan-500" />
                Total de Funcionários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (
                  totalEmployees
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Funcionários processados na folha atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Banknote className="mr-2 h-4 w-4 text-cyan-500" />
                Valor Total Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-32 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (
                  formatCurrency(totalPayroll + totalDeductions)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Soma dos salários brutos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-cyan-500" />
                Valor Total Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-32 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (
                  formatCurrency(totalPayroll)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor líquido a pagar aos funcionários
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Módulos da folha salarial */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((module, index) => (
          <Link 
            key={index} 
            href={module.href}
            className="group block"
          >
            <div className="h-full bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-cyan-300">
              <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-4`}>
                <module.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {module.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/Dashboard/folha-salarial/pagamento">
            <Button variant="outline" className="w-full justify-start">
              <Banknote className="mr-2 h-4 w-4" />
              Processar Folha de {currentMonthName}
            </Button>
          </Link>
          <Link href="/Dashboard/folha-salarial/holerite">
            <Button variant="outline" className="w-full justify-start">
              <ReceiptText className="mr-2 h-4 w-4" />
              Gerar Holerites
            </Button>
          </Link>
          <Link href="/Dashboard/folha-salarial/relatorio">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Relatório Mensal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}