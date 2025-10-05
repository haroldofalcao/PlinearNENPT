import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

// Tipos para os eventos customizados
export type AnalyticsEvent =
    // Eventos de Fórmulas
    | 'formula_export'
    | 'formula_import'
    | 'formula_created_manually'
    | 'formula_edited'
    | 'formula_deleted'
    // Eventos de Navegação
    | 'page_view'
    // Eventos de Calculadora/Otimização
    | 'optimization_started'
    | 'optimization_completed'
    | 'optimization_failed'
    | 'optimization_details_viewed';

interface EventParams {
    [key: string]: string | number | boolean | string[];
}

/**
 * Função central para logar eventos no Firebase Analytics
 */
export const trackEvent = (eventName: AnalyticsEvent, params?: EventParams) => {
    if (!analytics) {
        console.warn('Firebase Analytics não está inicializado');
        return;
    }

    try {
        logEvent(analytics, eventName as string, params);
        console.log(`📊 Event tracked: ${eventName}`, params);
    } catch (error) {
        console.error('Erro ao trackear evento:', error);
    }
};

// Funções específicas para cada tipo de evento

/**
 * Trackear exportação de fórmulas
 */
export const trackFormulaExport = (format: 'json' | 'xlsx', count: number) => {
    trackEvent('formula_export', {
        format,
        formula_count: count,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear importação de fórmulas
 */
export const trackFormulaImport = (format: 'json' | 'xlsx', count: number, success: boolean) => {
    trackEvent('formula_import', {
        format,
        formula_count: count,
        success,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear criação manual de fórmula
 */
export const trackFormulaCreated = (formulaName: string, method: 'manual' | 'duplicate') => {
    trackEvent('formula_created_manually', {
        formula_name: formulaName,
        creation_method: method,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear edição de fórmula
 */
export const trackFormulaEdited = (formulaId: string, formulaName: string) => {
    trackEvent('formula_edited', {
        formula_id: formulaId,
        formula_name: formulaName,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear exclusão de fórmula
 */
export const trackFormulaDeleted = (formulaId: string, formulaName: string) => {
    trackEvent('formula_deleted', {
        formula_id: formulaId,
        formula_name: formulaName,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear visualização de página
 */
export const trackPageView = (pageName: string, pageTitle: string) => {
    trackEvent('page_view', {
        page_name: pageName,
        page_title: pageTitle,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear início de otimização
 */
export const trackOptimizationStarted = (
    selectedFormulaIds: string[],
    volumeTotal: number,
    hasCustomRequirements: boolean
) => {
    trackEvent('optimization_started', {
        formula_count: selectedFormulaIds.length,
        volume_total: volumeTotal,
        has_custom_requirements: hasCustomRequirements,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear conclusão de otimização
 */
export const trackOptimizationCompleted = (
    formulasUsed: number,
    totalCost: number,
    executionTimeMs: number,
    volumeTotal: number
) => {
    trackEvent('optimization_completed', {
        formulas_used: formulasUsed,
        total_cost: totalCost,
        execution_time_ms: executionTimeMs,
        volume_total: volumeTotal,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear falha na otimização
 */
export const trackOptimizationFailed = (errorMessage: string, volumeTotal: number) => {
    trackEvent('optimization_failed', {
        error_message: errorMessage,
        volume_total: volumeTotal,
        timestamp: new Date().toISOString()
    });
};

/**
 * Trackear visualização de detalhes de otimização
 */
export const trackOptimizationDetailsViewed = (optimizationId: string, fromHistory: boolean) => {
    trackEvent('optimization_details_viewed', {
        optimization_id: optimizationId,
        from_history: fromHistory,
        timestamp: new Date().toISOString()
    });
};
