'use client'

import { useState, memo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SophisticatedBonusConfig, SophisticatedPenaltyConfig } from '@/types'
import { 
  Star, 
  Building2, 
  FolderOpen, 
  Award, 
  AlertTriangle, 
  Plus, 
  X,
  Briefcase,
  Calendar,
  CheckCircle
} from 'lucide-react'

interface SophisticatedBonusPenaltyProps {
  bonusConfig: SophisticatedBonusConfig
  penaltyConfig: SophisticatedPenaltyConfig
  onBonusChange: (config: SophisticatedBonusConfig) => void
  onPenaltyChange: (config: SophisticatedPenaltyConfig) => void
}

const SophisticatedBonusPenalty = memo(function SophisticatedBonusPenalty({
  bonusConfig,
  penaltyConfig,
  onBonusChange,
  onPenaltyChange
}: SophisticatedBonusPenaltyProps) {
  
  const [newUniversity, setNewUniversity] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newCertification, setNewCertification] = useState('')

  // Memoized handlers to prevent input focus loss
  const handleUniversityAdd = useCallback(() => {
    if (newUniversity.trim()) {
      onBonusChange({
        ...bonusConfig,
        preferredEducation: {
          ...bonusConfig.preferredEducation,
          specificUniversities: [...bonusConfig.preferredEducation.specificUniversities, newUniversity.trim()]
        }
      })
      setNewUniversity('')
    }
  }, [bonusConfig, newUniversity, onBonusChange])

  const handleCompanyAdd = useCallback(() => {
    if (newCompany.trim()) {
      onBonusChange({
        ...bonusConfig,
        preferredCompanies: {
          ...bonusConfig.preferredCompanies,
          specificCompanies: [...bonusConfig.preferredCompanies.specificCompanies, newCompany.trim()]
        }
      })
      setNewCompany('')
    }
  }, [bonusConfig, newCompany, onBonusChange])

  const handleCertificationAdd = useCallback(() => {
    if (newCertification.trim() && bonusConfig.valuableCertifications.certifications.length < 15) {
      onBonusChange({
        ...bonusConfig,
        valuableCertifications: {
          ...bonusConfig.valuableCertifications,
          certifications: [...bonusConfig.valuableCertifications.certifications, newCertification.trim()]
        }
      })
      setNewCertification('')
    }
  }, [bonusConfig, newCertification, onBonusChange])

  // Quality Bonuses Section
  const QualityBonusesSection = () => (
    <Card className="border-l-4 border-l-yellow-400">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-700">
          <Star className="mr-2 h-5 w-5" />
          Quality Bonuses
        </CardTitle>
        <p className="text-sm text-gray-600">Award extra points for excellence indicators</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Preferred Education */}
        <div className="bg-blue-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="preferred-education"
              checked={bonusConfig.preferredEducation.enabled}
              onCheckedChange={(checked) => 
                onBonusChange({
                  ...bonusConfig,
                  preferredEducation: {
                    ...bonusConfig.preferredEducation,
                    enabled: !!checked
                  }
                })
              }
            />
            <Label htmlFor="preferred-education" className="font-medium">
              Preferred Education
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Bonus points for candidates from preferred universities or categories
          </p>
          
          {bonusConfig.preferredEducation.enabled && (
            <div className="space-y-4">
              {/* Specific Universities */}
              <div>
                <Label className="text-sm font-medium">Specific Universities</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    placeholder="e.g., Stanford University"
                    value={newUniversity}
                    onChange={(e) => setNewUniversity(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleUniversityAdd()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUniversityAdd}
                  >
                    <Plus className="h-4 w-4" />
                    Add University
                  </Button>
                </div>
                
                {/* Display added universities */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {bonusConfig.preferredEducation.specificUniversities.map((uni, index) => (
                    <div key={index} className="flex items-center bg-blue-100 px-2 py-1 rounded text-sm">
                      <span>{uni}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => {
                          onBonusChange({
                            ...bonusConfig,
                            preferredEducation: {
                              ...bonusConfig.preferredEducation,
                              specificUniversities: bonusConfig.preferredEducation.specificUniversities.filter((_, i) => i !== index)
                            }
                          })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* University Categories */}
              <div>
                <Label className="text-sm font-medium mb-2 block">OR Select Categories</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="top-league"
                      checked={bonusConfig.preferredEducation.categories.topLeague}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredEducation: {
                            ...bonusConfig.preferredEducation,
                            categories: {
                              ...bonusConfig.preferredEducation.categories,
                              topLeague: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="top-league" className="text-sm">Top League (Ivy League/Oxbridge)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="top-50-global"
                      checked={bonusConfig.preferredEducation.categories.top50Global}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredEducation: {
                            ...bonusConfig.preferredEducation,
                            categories: {
                              ...bonusConfig.preferredEducation.categories,
                              top50Global: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="top-50-global" className="text-sm">Top 50 Global Universities</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="top-100-global"
                      checked={bonusConfig.preferredEducation.categories.top100Global}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredEducation: {
                            ...bonusConfig.preferredEducation,
                            categories: {
                              ...bonusConfig.preferredEducation.categories,
                              top100Global: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="top-100-global" className="text-sm">Top 100 Global Universities</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="regional-top"
                      checked={bonusConfig.preferredEducation.categories.regionalTop}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredEducation: {
                            ...bonusConfig.preferredEducation,
                            categories: {
                              ...bonusConfig.preferredEducation.categories,
                              regionalTop: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="regional-top" className="text-sm">Regional Top Universities</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preferred Company Experience */}
        <div className="bg-green-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="preferred-companies"
              checked={bonusConfig.preferredCompanies.enabled}
              onCheckedChange={(checked) => 
                onBonusChange({
                  ...bonusConfig,
                  preferredCompanies: {
                    ...bonusConfig.preferredCompanies,
                    enabled: !!checked
                  }
                })
              }
            />
            <Label htmlFor="preferred-companies" className="font-medium">
              Preferred Company Experience
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Bonus points for candidates with experience at target companies
          </p>
          
          {bonusConfig.preferredCompanies.enabled && (
            <div className="space-y-4">
              {/* Specific Companies */}
              <div>
                <Label className="text-sm font-medium">Specific Companies</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    placeholder="e.g., Google, Apple, Microsoft"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCompanyAdd()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCompanyAdd}
                  >
                    <Plus className="h-4 w-4" />
                    Add Company
                  </Button>
                </div>
                
                {/* Display added companies */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {bonusConfig.preferredCompanies.specificCompanies.map((company, index) => (
                    <div key={index} className="flex items-center bg-green-100 px-2 py-1 rounded text-sm">
                      <span>{company}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => {
                          onBonusChange({
                            ...bonusConfig,
                            preferredCompanies: {
                              ...bonusConfig.preferredCompanies,
                              specificCompanies: bonusConfig.preferredCompanies.specificCompanies.filter((_, i) => i !== index)
                            }
                          })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Categories */}
              <div>
                <Label className="text-sm font-medium mb-2 block">OR Select Categories</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="faang-tech"
                      checked={bonusConfig.preferredCompanies.categories.faangTech}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredCompanies: {
                            ...bonusConfig.preferredCompanies,
                            categories: {
                              ...bonusConfig.preferredCompanies.categories,
                              faangTech: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="faang-tech" className="text-sm">FAANG/Top Tech Companies</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unicorns"
                      checked={bonusConfig.preferredCompanies.categories.unicorns}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredCompanies: {
                            ...bonusConfig.preferredCompanies,
                            categories: {
                              ...bonusConfig.preferredCompanies.categories,
                              unicorns: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="unicorns" className="text-sm">Unicorns ($1B+ startups)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fortune-500"
                      checked={bonusConfig.preferredCompanies.categories.fortune500}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredCompanies: {
                            ...bonusConfig.preferredCompanies,
                            categories: {
                              ...bonusConfig.preferredCompanies.categories,
                              fortune500: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="fortune-500" className="text-sm">Fortune 500</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="industry-leaders"
                      checked={bonusConfig.preferredCompanies.categories.industryLeaders}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredCompanies: {
                            ...bonusConfig.preferredCompanies,
                            categories: {
                              ...bonusConfig.preferredCompanies.categories,
                              industryLeaders: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="industry-leaders" className="text-sm">Industry Leaders</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="direct-competitors"
                      checked={bonusConfig.preferredCompanies.categories.directCompetitors}
                      onCheckedChange={(checked) =>
                        onBonusChange({
                          ...bonusConfig,
                          preferredCompanies: {
                            ...bonusConfig.preferredCompanies,
                            categories: {
                              ...bonusConfig.preferredCompanies.categories,
                              directCompetitors: !!checked
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="direct-competitors" className="text-sm">Direct Competitors</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Project Experience */}
        <div className="bg-purple-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="related-projects"
              checked={bonusConfig.relatedProjects.enabled}
              onCheckedChange={(checked) => 
                onBonusChange({
                  ...bonusConfig,
                  relatedProjects: {
                    ...bonusConfig.relatedProjects,
                    enabled: !!checked
                  }
                })
              }
            />
            <Label htmlFor="related-projects" className="font-medium">
              Related Project Experience
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Evaluate project relevance on a 1-10 scale
          </p>
          
          {bonusConfig.relatedProjects.enabled && (
            <div>
              <Label htmlFor="project-description" className="text-sm font-medium">
                Describe ideal project experience:
              </Label>
              <Textarea
                id="project-description"
                placeholder="e.g., Built distributed systems handling millions of requests. Led migration to microservices. Implemented ML models in production."
                value={bonusConfig.relatedProjects.idealProjectDescription}
                onChange={(e) =>
                  onBonusChange({
                    ...bonusConfig,
                    relatedProjects: {
                      ...bonusConfig.relatedProjects,
                      idealProjectDescription: e.target.value
                    }
                  })
                }
                className="mt-2 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                AI will compare candidate projects to this description (up to 5 projects evaluated)
              </p>
            </div>
          )}
        </div>

        {/* Valuable Certifications */}
        <div className="bg-orange-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="valuable-certifications"
              checked={bonusConfig.valuableCertifications.enabled}
              onCheckedChange={(checked) => 
                onBonusChange({
                  ...bonusConfig,
                  valuableCertifications: {
                    ...bonusConfig.valuableCertifications,
                    enabled: !!checked
                  }
                })
              }
            />
            <Label htmlFor="valuable-certifications" className="font-medium">
              Valuable Certifications
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Evaluate certification relevance on a 1-10 scale
          </p>
          
          {bonusConfig.valuableCertifications.enabled && (
            <div>
              <div className="flex space-x-2 mb-3">
                <Input
                  placeholder="e.g., AWS Solutions Architect, PMP, CPA"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCertificationAdd()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={bonusConfig.valuableCertifications.certifications.length >= 15}
                  onClick={handleCertificationAdd}
                >
                  <Plus className="h-4 w-4" />
                  Add Certification
                </Button>
              </div>
              
              {/* Display added certifications */}
              <div className="flex flex-wrap gap-2">
                {bonusConfig.valuableCertifications.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center bg-orange-100 px-2 py-1 rounded text-sm">
                    <span>{cert}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-4 w-4 p-0"
                      onClick={() => {
                        onBonusChange({
                          ...bonusConfig,
                          valuableCertifications: {
                            ...bonusConfig.valuableCertifications,
                            certifications: bonusConfig.valuableCertifications.certifications.filter((_, i) => i !== index)
                          }
                        })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {bonusConfig.valuableCertifications.certifications.length}/15 certifications added
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Risk Penalties Section
  const RiskPenaltiesSection = () => (
    <Card className="border-l-4 border-l-red-400">
      <CardHeader>
        <CardTitle className="flex items-center text-red-700">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Risk Penalties
        </CardTitle>
        <p className="text-sm text-gray-600">Deduct points for potential concerns</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Job Stability Check */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="job-stability"
              checked={penaltyConfig.jobStabilityCheck.enabled}
              onCheckedChange={(checked) => 
                onPenaltyChange({
                  ...penaltyConfig,
                  jobStabilityCheck: {
                    ...penaltyConfig.jobStabilityCheck,
                    enabled: !!checked
                  }
                })
              }
            />
            <Label htmlFor="job-stability" className="font-medium">
              Job Stability Check
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Assess employment stability and retention risk
          </p>
          
          {penaltyConfig.jobStabilityCheck.enabled && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                How concerned about job hopping?
              </Label>
              <Select
                value={penaltyConfig.jobStabilityCheck.jobHoppingConcern}
                onValueChange={(value: 'lenient' | 'moderate' | 'strict') =>
                  onPenaltyChange({
                    ...penaltyConfig,
                    jobStabilityCheck: {
                      ...penaltyConfig.jobStabilityCheck,
                      jobHoppingConcern: value
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict (&gt;20% short tenures)</SelectItem>
                  <SelectItem value="moderate">Moderate (&gt;30% short tenures)</SelectItem>
                  <SelectItem value="lenient">Lenient (&gt;50% short tenures)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Employment Gap Check */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="employment-gap"
              checked={penaltyConfig.employmentGapCheck.enabled}
              onCheckedChange={(checked) => 
                onPenaltyChange({
                  ...penaltyConfig,
                  employmentGapCheck: {
                    ...penaltyConfig.employmentGapCheck,
                    enabled: !!checked
                  }
                })
              }
            />
            <Label htmlFor="employment-gap" className="font-medium">
              Employment Gap Check
            </Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Flag unexplained career gaps
          </p>
          
          {penaltyConfig.employmentGapCheck.enabled && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Gaps longer than:
              </Label>
              <Select
                value={penaltyConfig.employmentGapCheck.gapThreshold}
                onValueChange={(value: '6months' | '1year' | '2years') =>
                  onPenaltyChange({
                    ...penaltyConfig,
                    employmentGapCheck: {
                      ...penaltyConfig.employmentGapCheck,
                      gapThreshold: value
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 months</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="2years">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Configuration Summary
  const ConfigurationSummary = () => {
    const activeBonuses = [
      bonusConfig.preferredEducation.enabled && 'Preferred Education',
      bonusConfig.preferredCompanies.enabled && 'Preferred Companies',
      bonusConfig.relatedProjects.enabled && 'Related Projects',
      bonusConfig.valuableCertifications.enabled && 'Valuable Certifications'
    ].filter(Boolean)

    const activePenalties = [
      penaltyConfig.jobStabilityCheck.enabled && 'Job Stability Check',
      penaltyConfig.employmentGapCheck.enabled && 'Employment Gap Check'
    ].filter(Boolean)

    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-2">Active Bonuses ({activeBonuses.length})</h4>
              {activeBonuses.length > 0 ? (
                <ul className="space-y-1">
                  {activeBonuses.map((bonus, index) => (
                    <li key={index} className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {bonus}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No bonuses configured</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-red-700 mb-2">Active Penalties ({activePenalties.length})</h4>
              {activePenalties.length > 0 ? (
                <ul className="space-y-1">
                  {activePenalties.map((penalty, index) => (
                    <li key={index} className="flex items-center text-sm text-red-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {penalty}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No penalties configured</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>AI Impact:</strong> You've enabled advanced AI scoring with sophisticated bonus/penalty calculations. 
              This will provide more nuanced and accurate candidate evaluations beyond basic skills matching.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <QualityBonusesSection />
      <RiskPenaltiesSection />
      <ConfigurationSummary />
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    JSON.stringify(prevProps.bonusConfig) === JSON.stringify(nextProps.bonusConfig) &&
    JSON.stringify(prevProps.penaltyConfig) === JSON.stringify(nextProps.penaltyConfig)
  )
})

export { SophisticatedBonusPenalty }