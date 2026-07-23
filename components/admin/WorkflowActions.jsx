'use client'

import { useState } from 'react'
import { Send, Eye, CheckCircle, FileText, Clock, AlertCircle } from 'lucide-react'
import { adminApiFetch } from '../../lib/adminApiClient'

const WORKFLOW_STEPS = {
  draft: { label: 'Draft', icon: FileText, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  review: { label: 'In Review', icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  published: { label: 'Published', icon: Eye, color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
}

export default function WorkflowActions({ 
  entityType, 
  entityId, 
  currentStatus, 
  onStatusChange 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function advanceWorkflow(newStatus) {
    setLoading(true)
    setError('')
    try {
      await adminApiFetch('/api/cms/workflow/advance', {
        method: 'POST',
        body: {
          entity_type: entityType,
          entity_id: entityId,
          new_status: newStatus,
        },
      })
      if (onStatusChange) onStatusChange(newStatus)
    } catch (err) {
      setError(err?.message || 'Failed to advance workflow')
    } finally {
      setLoading(false)
    }
  }

  function getNextSteps() {
    const steps = []
    
    if (currentStatus === 'draft') {
      steps.push({ status: 'review', label: 'Submit for Review', icon: Send })
      steps.push({ status: 'published', label: 'Publish Directly', icon: Eye })
    }
    
    if (currentStatus === 'review') {
      steps.push({ status: 'approved', label: 'Approve', icon: CheckCircle })
      steps.push({ status: 'draft', label: 'Request Changes', icon: FileText })
    }
    
    if (currentStatus === 'approved') {
      steps.push({ status: 'published', label: 'Publish', icon: Eye })
      steps.push({ status: 'review', label: 'Send Back to Review', icon: Clock })
    }
    
    if (currentStatus === 'published') {
      steps.push({ status: 'draft', label: 'Unpublish to Draft', icon: FileText })
    }
    
    return steps
  }

  const currentStep = WORKFLOW_STEPS[currentStatus] || WORKFLOW_STEPS.draft
  const nextSteps = getNextSteps()
  const CurrentIcon = currentStep.icon

  return (
    <div className="flex items-center gap-3">
      {/* Current Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentStep.bgColor}`}>
        <CurrentIcon className={`w-4 h-4 ${currentStep.color}`} />
        <span className={`text-sm font-medium ${currentStep.color}`}>
          {currentStep.label}
        </span>
      </div>

      {/* Workflow Actions */}
      {nextSteps.length > 0 && (
        <div className="flex items-center gap-2">
          {nextSteps.map((step) => {
            const StepIcon = step.icon
            return (
              <button
                key={step.status}
                type="button"
                onClick={() => advanceWorkflow(step.status)}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                  step.status === 'published'
                    ? 'border-teal-500/30 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'
                } disabled:opacity-50`}
              >
                <StepIcon className="w-3.5 h-3.5" />
                <span className="text-sm">{step.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}