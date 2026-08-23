const { Op } = require('sequelize');
const {
  ProjectProgress, FinancialRecord, Risk, Issue, Resource,
  Intervention, RecoveryPlan, ForwardLook, Contract, Milestone, Deliverable, Project, User
} = require('../models');
const { calcScheduleMetrics, calcRiskRating, calcFinancialMetrics, calcResourceShortfall } = require('../utils/calculations');

// ─── Helper for Role-Based Project Filtering ────────────────────────────────
const getProjectInclude = (userRole) => {
  const include = { model: Project, attributes: ['id', 'project_code', 'project_name'] };
  if (userRole === 'DESIGN_DIRECTOR') {
    include.where = { project_type: 'DESIGN' };
    include.required = true;
  } else if (userRole === 'CONTRACT_ADMIN_DIRECTOR') {
    include.where = { project_type: 'SUPERVISION' };
    include.required = true;
  }
  return include;
};

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
const progressService = {
  getAll: async (projectId, userRole = null) => {
    // Ensure all projects have at least a baseline progress entry so they are immediately visible and searchable
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name', 'commencement_date'] });
      for (const proj of allProjects) {
        const count = await ProjectProgress.count({ where: { project_id: proj.id } });
        if (count === 0) {
          const today = new Date();
          const dateStr = proj.commencement_date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
          await ProjectProgress.create({
            project_id: proj.id,
            reporting_month: dateStr,
            planned_progress: 0,
            actual_progress: 0,
            schedule_variance: 0,
            spi: 1.0,
            time_elapsed_percent: 0,
            time_remaining_percent: 100,
            notes: 'Initial project baseline',
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline progress records:', e.message);
    }

    return ProjectProgress.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['reporting_month', 'DESC']],
    });
  },
  getById: async (id) => {
    const r = await ProjectProgress.findByPk(id);
    if (!r) throw { status: 404, message: 'Progress record not found.' };
    return r;
  },
  create: async (data) => {
    const dup = await ProjectProgress.findOne({ where: { project_id: data.project_id, reporting_month: data.reporting_month } });
    if (dup) throw { status: 409, message: 'A progress record for this project and reporting month already exists.' };
    const { schedule_variance, spi } = calcScheduleMetrics(data.planned_progress, data.actual_progress);
    return ProjectProgress.create({ ...data, schedule_variance, spi });
  },
  update: async (id, data) => {
    const r = await ProjectProgress.findByPk(id);
    if (!r) throw { status: 404, message: 'Progress record not found.' };
    if (data.planned_progress !== undefined || data.actual_progress !== undefined) {
      const { schedule_variance, spi } = calcScheduleMetrics(
        data.planned_progress ?? r.planned_progress,
        data.actual_progress  ?? r.actual_progress
      );
      data.schedule_variance = schedule_variance;
      data.spi = spi;
    }
    return r.update(data);
  },
  remove: async (id) => {
    const r = await ProjectProgress.findByPk(id);
    if (!r) throw { status: 404, message: 'Progress record not found.' };
    await r.destroy();
  },
};

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
const contractService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      for (const proj of allProjects) {
        const count = await Contract.count({ where: { project_id: proj.id } });
        if (count === 0) {
          await Contract.create({
            project_id: proj.id,
            contract_no: `${proj.project_code || 'PRJ'}-CONT-01`,
            contract_title: `Main Contract for ${proj.project_name || 'Project'}`,
            original_contract_value: 0,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline contracts:', e.message);
    }
    return Contract.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['created_at', 'DESC']],
    });
  },
  getById: async (id) => {
    const r = await Contract.findByPk(id, { include: [{ model: Project, attributes: ['id', 'project_code', 'project_name'] }] });
    if (!r) throw { status: 404, message: 'Contract not found.' };
    return r;
  },
  create: async (data) => {
    const m = calcFinancialMetrics({ original_contract_value: data.original_contract_value, variation_value: data.variation_value || 0 });
    return Contract.create({ ...data, revised_contract_value: m.revised_contract_value });
  },
  update: async (id, data) => {
    const r = await Contract.findByPk(id);
    if (!r) throw { status: 404, message: 'Contract not found.' };
    if (data.original_contract_value !== undefined || data.variation_value !== undefined) {
      const m = calcFinancialMetrics({ original_contract_value: data.original_contract_value ?? r.original_contract_value, variation_value: data.variation_value ?? r.variation_value });
      data.revised_contract_value = m.revised_contract_value;
    }
    return r.update(data);
  },
  remove: async (id) => {
    const r = await Contract.findByPk(id);
    if (!r) throw { status: 404, message: 'Contract not found.' };
    await r.destroy();
  },
};

// ─── MILESTONES ───────────────────────────────────────────────────────────────
const milestoneService = {
  getAll: async (projectId, userRole = null) => {
    // Ensure all projects have at least a baseline kickoff milestone
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name', 'commencement_date'] });
      for (const proj of allProjects) {
        const count = await Milestone.count({ where: { project_id: proj.id } });
        if (count === 0) {
          const today = new Date();
          const dateStr = proj.commencement_date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
          await Milestone.create({
            project_id: proj.id,
            name: 'Project Commencement / Kickoff',
            planned_date: dateStr,
            status: 'IN_PROGRESS',
            is_critical: true,
            notes: 'Project commencement milestone',
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline milestones:', e.message);
    }

    return Milestone.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['planned_date', 'ASC']],
    });
  },
  getById: async (id) => {
    const r = await Milestone.findByPk(id);
    if (!r) throw { status: 404, message: 'Milestone not found.' };
    return r;
  },
  create: async (data) => Milestone.create(data),
  update: async (id, data) => {
    const r = await Milestone.findByPk(id);
    if (!r) throw { status: 404, message: 'Milestone not found.' };
    return r.update(data);
  },
  remove: async (id) => {
    const r = await Milestone.findByPk(id);
    if (!r) throw { status: 404, message: 'Milestone not found.' };
    await r.destroy();
  },
};

// ─── DELIVERABLES ─────────────────────────────────────────────────────────────
const deliverableService = {
  getAll: async (projectId, userRole = null) => {
    // Ensure all projects have at least a baseline deliverable
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name', 'commencement_date'] });
      for (const proj of allProjects) {
        const count = await Deliverable.count({ where: { project_id: proj.id } });
        if (count === 0) {
          const today = new Date();
          const dateStr = proj.commencement_date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
          await Deliverable.create({
            project_id: proj.id,
            name: 'Initial Project Report',
            category: 'REPORT',
            planned_date: dateStr,
            status: 'PLANNED',
            description: 'Baseline deliverable',
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline deliverables:', e.message);
    }

    return Deliverable.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['planned_date', 'ASC']],
    });
  },
  getById: async (id) => {
    const r = await Deliverable.findByPk(id);
    if (!r) throw { status: 404, message: 'Deliverable not found.' };
    return r;
  },
  create: async (data) => Deliverable.create(data),
  update: async (id, data) => {
    const r = await Deliverable.findByPk(id);
    if (!r) throw { status: 404, message: 'Deliverable not found.' };
    return r.update(data);
  },
  remove: async (id) => {
    const r = await Deliverable.findByPk(id);
    if (!r) throw { status: 404, message: 'Deliverable not found.' };
    await r.destroy();
  },
};

// ─── FINANCIALS ───────────────────────────────────────────────────────────────
const financialService = {
  getAll: async (projectId, userRole = null) => {
    // Ensure all projects have at least a baseline financial record
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name', 'commencement_date', 'contract_value'] });
      for (const proj of allProjects) {
        const count = await FinancialRecord.count({ where: { project_id: proj.id } });
        if (count === 0) {
          const today = new Date();
          const dateStr = proj.commencement_date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
          await FinancialRecord.create({
            project_id: proj.id,
            reporting_month: dateStr,
            original_contract_value: proj.contract_value || 0,
            revised_contract_value: proj.contract_value || 0,
            variation_value: 0,
            planned_invoicing: 0,
            actual_invoicing: 0,
            amount_certified: 0,
            amount_received: 0,
            outstanding_payment: 0,
            planned_cost: 0,
            actual_cost: 0,
            forecast_cost: 0,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline financial records:', e.message);
    }

    return FinancialRecord.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['reporting_month', 'DESC']],
    });
  },
  getById: async (id) => {
    const r = await FinancialRecord.findByPk(id);
    if (!r) throw { status: 404, message: 'Financial record not found.' };
    return r;
  },
  create: async (data) => {
    const dup = await FinancialRecord.findOne({ where: { project_id: data.project_id, reporting_month: data.reporting_month } });
    if (dup) throw { status: 409, message: 'A financial record for this project and reporting month already exists.' };
    const m = calcFinancialMetrics(data);
    return FinancialRecord.create({ ...data, revised_contract_value: m.revised_contract_value, outstanding_payment: m.outstanding_payment });
  },
  update: async (id, data) => {
    const r = await FinancialRecord.findByPk(id);
    if (!r) throw { status: 404, message: 'Financial record not found.' };
    const merged = { ...r.toJSON(), ...data };
    const m = calcFinancialMetrics(merged);
    return r.update({ ...data, revised_contract_value: m.revised_contract_value, outstanding_payment: m.outstanding_payment });
  },
  remove: async (id) => {
    const r = await FinancialRecord.findByPk(id);
    if (!r) throw { status: 404, message: 'Financial record not found.' };
    await r.destroy();
  },
};

// ─── RISKS ────────────────────────────────────────────────────────────────────
const riskService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      for (const proj of allProjects) {
        const count = await Risk.count({ where: { project_id: proj.id } });
        if (count === 0) {
          await Risk.create({
            project_id: proj.id,
            risk_code: `${proj.project_code || 'PRJ'}-RSK-01`,
            description: 'Baseline project execution risk',
            probability: 'LOW',
            impact: 'LOW',
            status: 'CLOSED'
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline risks:', e.message);
    }
    return Risk.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['rating', 'DESC']],
    });
  },
  getById: async (id) => {
    const r = await Risk.findByPk(id);
    if (!r) throw { status: 404, message: 'Risk not found.' };
    return r;
  },
  create: async (data) => {
    const { score } = calcRiskRating(data.probability, data.impact);
    return Risk.create({ ...data, rating: score });
  },
  update: async (id, data) => {
    const r = await Risk.findByPk(id);
    if (!r) throw { status: 404, message: 'Risk not found.' };
    if (data.probability || data.impact) {
      const { score } = calcRiskRating(data.probability || r.probability, data.impact || r.impact);
      data.rating = score;
    }
    return r.update(data);
  },
  remove: async (id) => {
    const r = await Risk.findByPk(id);
    if (!r) throw { status: 404, message: 'Risk not found.' };
    await r.destroy();
  },
};

// ─── ISSUES ───────────────────────────────────────────────────────────────────
const issueService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      for (const proj of allProjects) {
        const count = await Issue.count({ where: { project_id: proj.id } });
        if (count === 0) {
          await Issue.create({
            project_id: proj.id,
            issue_code: `${proj.project_code || 'PRJ'}-ISS-01`,
            description: 'Baseline issue record (placeholder)',
            severity: 'LOW',
            status: 'CLOSED'
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline issues:', e.message);
    }
    return Issue.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['severity', 'DESC']],
    });
  },
  getById: async (id) => {
    const r = await Issue.findByPk(id);
    if (!r) throw { status: 404, message: 'Issue not found.' };
    return r;
  },
  create: async (data) => Issue.create(data),
  update: async (id, data) => {
    const r = await Issue.findByPk(id);
    if (!r) throw { status: 404, message: 'Issue not found.' };
    return r.update(data);
  },
  remove: async (id) => {
    const r = await Issue.findByPk(id);
    if (!r) throw { status: 404, message: 'Issue not found.' };
    await r.destroy();
  },
};

// ─── RESOURCES ────────────────────────────────────────────────────────────────
const resourceService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      const types = ['HUMAN_RESOURCE', 'VEHICLE', 'EQUIPMENT'];
      for (const proj of allProjects) {
        for (const rType of types) {
          const count = await Resource.count({ where: { project_id: proj.id, resource_type: rType } });
          if (count === 0) {
            await Resource.create({
              project_id: proj.id,
              resource_type: rType,
              resource_name: `Baseline ${rType.replace('_', ' ')}`,
              required_quantity: 0,
              available_quantity: 0,
              operational_quantity: 0,
              shortfall: 0,
              notes: 'System generated baseline',
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error('Error checking baseline resources:', e.message);
    }

    return Resource.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
    });
  },
  getById: async (id) => {
    const r = await Resource.findByPk(id);
    if (!r) throw { status: 404, message: 'Resource not found.' };
    return r;
  },
  create: async (data) => {
    const shortfall = calcResourceShortfall(data.required_quantity, data.available_quantity);
    return Resource.create({ ...data, shortfall });
  },
  update: async (id, data) => {
    const r = await Resource.findByPk(id);
    if (!r) throw { status: 404, message: 'Resource not found.' };
    const shortfall = calcResourceShortfall(data.required_quantity ?? r.required_quantity, data.available_quantity ?? r.available_quantity);
    return r.update({ ...data, shortfall });
  },
  remove: async (id) => {
    const r = await Resource.findByPk(id);
    if (!r) throw { status: 404, message: 'Resource not found.' };
    await r.destroy();
  },
};

// ─── INTERVENTIONS ────────────────────────────────────────────────────────────
const interventionService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      for (const proj of allProjects) {
        const count = await Intervention.count({ where: { project_id: proj.id } });
        if (count === 0) {
          await Intervention.create({
            project_id: proj.id,
            priority: 'LOW',
            problem: 'Baseline management intervention placeholder',
            required_decision: 'None required',
            status: 'COMPLETED'
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline interventions:', e.message);
    }
    
    const projectInclude = getProjectInclude(userRole);
    return Intervention.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [
        projectInclude,
        { model: Risk,    attributes: ['id', 'risk_code'], required: false },
        { model: Issue,   attributes: ['id', 'issue_code'], required: false },
      ],
      order: [['deadline', 'ASC']],
    });
  },
  getById: async (id) => {
    const r = await Intervention.findByPk(id);
    if (!r) throw { status: 404, message: 'Intervention not found.' };
    return r;
  },
  create: async (data) => Intervention.create(data),
  update: async (id, data) => {
    const r = await Intervention.findByPk(id);
    if (!r) throw { status: 404, message: 'Intervention not found.' };
    return r.update(data);
  },
  remove: async (id) => {
    const r = await Intervention.findByPk(id);
    if (!r) throw { status: 404, message: 'Intervention not found.' };
    await r.destroy();
  },
};

// ─── RECOVERY PLANS ───────────────────────────────────────────────────────────
const recoveryService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      for (const proj of allProjects) {
        const count = await RecoveryPlan.count({ where: { project_id: proj.id } });
        if (count === 0) {
          await RecoveryPlan.create({
            project_id: proj.id,
            original_gap: 0,
            recovery_target_gap: 0,
            current_gap: 0,
            recovery_status: 'COMPLETED',
            recovery_action: 'Baseline recovery placeholder',
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline recovery plans:', e.message);
    }
    return RecoveryPlan.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
    });
  },
  getById: async (id) => {
    const r = await RecoveryPlan.findByPk(id);
    if (!r) throw { status: 404, message: 'Recovery plan not found.' };
    return r;
  },
  create: async (data) => RecoveryPlan.create(data),
  update: async (id, data) => {
    const r = await RecoveryPlan.findByPk(id);
    if (!r) throw { status: 404, message: 'Recovery plan not found.' };
    return r.update(data);
  },
  remove: async (id) => {
    const r = await RecoveryPlan.findByPk(id);
    if (!r) throw { status: 404, message: 'Recovery plan not found.' };
    await r.destroy();
  },
};

// ─── FORWARD LOOK ─────────────────────────────────────────────────────────────
const forwardLookService = {
  getAll: async (projectId, userRole = null) => {
    try {
      const allProjects = await Project.findAll({ attributes: ['id', 'project_code', 'project_name'] });
      for (const proj of allProjects) {
        const count = await ForwardLook.count({ where: { project_id: proj.id } });
        if (count === 0) {
          await ForwardLook.create({
            project_id: proj.id,
            period: 'NEXT_30_DAYS',
            category: 'OTHER',
            description: 'Baseline forward look placeholder',
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Error checking baseline forward look:', e.message);
    }
    return ForwardLook.findAll({
      where: projectId ? { project_id: projectId } : {},
      include: [getProjectInclude(userRole)],
      order: [['expected_date', 'ASC']],
    });
  },
  getById: async (id) => {
    const r = await ForwardLook.findByPk(id);
    if (!r) throw { status: 404, message: 'Forward look item not found.' };
    return r;
  },
  create: async (data) => ForwardLook.create(data),
  update: async (id, data) => {
    const r = await ForwardLook.findByPk(id);
    if (!r) throw { status: 404, message: 'Forward look item not found.' };
    return r.update(data);
  },
  remove: async (id) => {
    const r = await ForwardLook.findByPk(id);
    if (!r) throw { status: 404, message: 'Forward look item not found.' };
    await r.destroy();
  },
};

// ─── USERS ────────────────────────────────────────────────────────────────────
const userService = {
  getAll: async () => User.findAll({ attributes: { exclude: ['password_hash'] } }),
  getById: async (id) => {
    const r = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
    if (!r) throw { status: 404, message: 'User not found.' };
    return r;
  },
  update: async (id, data) => {
    const r = await User.findByPk(id);
    if (!r) throw { status: 404, message: 'User not found.' };
    const { password_hash, ...safe } = data;
    return r.update(safe);
  },
  remove: async (id) => {
    const r = await User.findByPk(id);
    if (!r) throw { status: 404, message: 'User not found.' };
    await r.destroy();
  },
};

module.exports = {
  progressService, contractService, milestoneService, deliverableService,
  financialService, riskService, issueService, resourceService,
  interventionService, recoveryService, forwardLookService, userService,
};
