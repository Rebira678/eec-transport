const { Op } = require('sequelize');
const { Project, User, ProjectProgress, FinancialRecord, Risk, Issue, Intervention } = require('../models');
const { calcScheduleMetrics, deriveStatusFromSPI } = require('../utils/calculations');
const sequelize = require('../config/database');

// Roles that see all projects
const ALL_PROJECT_ROLES = ['ADMIN', 'MANAGING_DIRECTOR', 'PPM_MANAGER', 'SECTOR_FINANCE'];

const getProjectTypeFilter = (userRole) => {
  if (userRole === 'DESIGN_DIRECTOR') return 'DESIGN';
  if (userRole === 'CONTRACT_ADMIN_DIRECTOR') return 'SUPERVISION';
  return null; // no filter — see all
};

const buildWhereClause = (query, userRole) => {
  const isPostgres = sequelize.getDialect() === 'postgres';
  const likeOp = isPostgres ? Op.iLike : Op.like;

  const where = {};
  if (query.project_status) where.project_status = query.project_status;
  if (query.project_type)   where.project_type   = query.project_type;
  if (query.client) where.client = { [likeOp]: `%${query.client}%` };
  if (query.project_manager_id) where.project_manager_id = query.project_manager_id;
  if (query.search) {
    where[Op.or] = [
      { project_name: { [likeOp]: `%${query.search}%` } },
      { project_code: { [likeOp]: `%${query.search}%` } },
      { client:       { [likeOp]: `%${query.search}%` } },
    ];
  }
  // Enforce project type visibility based on user role
  const typeFilter = getProjectTypeFilter(userRole);
  if (typeFilter) where.project_type = typeFilter;

  return where;
};

const getLatestProgress = async (projectId) => {
  return ProjectProgress.findOne({
    where: { project_id: projectId },
    order: [['reporting_month', 'DESC']],
  });
};

const getLatestFinancial = async (projectId) => {
  return FinancialRecord.findOne({
    where: { project_id: projectId },
    order: [['reporting_month', 'DESC']],
  });
};

const getAll = async (query = {}, userRole = null) => {
  const where = buildWhereClause(query, userRole);
  const projects = await Project.findAll({
    where,
    include: [{ model: User, as: 'project_manager', attributes: ['id', 'name', 'email'] }],
    order: [['project_name', 'ASC']],
  });
  // Attach latest progress and computed status
  const enriched = await Promise.all(
    projects.map(async (p) => {
      const prog = await getLatestProgress(p.id);
      const fin  = await getLatestFinancial(p.id);
      const metrics = prog
        ? calcScheduleMetrics(prog.planned_progress, prog.actual_progress)
        : { schedule_variance: null, spi: null };
      const health_status = deriveStatusFromSPI(metrics.spi);
      return {
        ...p.toJSON(),
        latest_planned:  prog ? prog.planned_progress : null,
        latest_actual:   prog ? prog.actual_progress  : null,
        schedule_variance: metrics.schedule_variance,
        spi: metrics.spi,
        health_status,
        financial_progress: fin && fin.revised_contract_value > 0
          ? parseFloat(((fin.amount_received / fin.revised_contract_value) * 100).toFixed(2))
          : null,
      };
    })
  );
  return enriched;
};

const getById = async (id) => {
  const project = await Project.findByPk(id, {
    include: [{ model: User, as: 'project_manager', attributes: ['id', 'name', 'email'] }],
  });
  if (!project) throw { status: 404, message: 'Project not found.' };
  const prog = await getLatestProgress(id);
  const fin  = await getLatestFinancial(id);
  const metrics = prog
    ? calcScheduleMetrics(prog.planned_progress, prog.actual_progress)
    : { schedule_variance: null, spi: null };
  const health_status = deriveStatusFromSPI(metrics.spi);
  return {
    ...project.toJSON(),
    latest_planned: prog ? prog.planned_progress : null,
    latest_actual:  prog ? prog.actual_progress  : null,
    schedule_variance: metrics.schedule_variance,
    spi: metrics.spi,
    health_status,
    financial_progress: fin && fin.revised_contract_value > 0
      ? parseFloat(((fin.amount_received / fin.revised_contract_value) * 100).toFixed(2))
      : null,
  };
};

const create = async (data) => {
  const existing = await Project.findOne({ where: { project_code: data.project_code } });
  if (existing) throw { status: 409, message: `Project code '${data.project_code}' already exists.` };
  const project = await Project.create(data);

  // Initialize baseline progress and kickoff milestone
  const today = new Date();
  const dateStr = project.commencement_date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  
  await ProjectProgress.create({
    project_id: project.id,
    reporting_month: dateStr,
    planned_progress: 0,
    actual_progress: 0,
    schedule_variance: 0,
    spi: 1.0,
    time_elapsed_percent: 0,
    time_remaining_percent: 100,
    notes: 'Initial project baseline',
  }).catch(() => {});

  const { Milestone } = require('../models');
  await Milestone.create({
    project_id: project.id,
    name: 'Project Commencement / Kickoff',
    planned_date: dateStr,
    status: 'IN_PROGRESS',
    is_critical: true,
    notes: 'Project commencement milestone',
  }).catch(() => {});

  return project;
};

const update = async (id, data) => {
  const project = await Project.findByPk(id);
  if (!project) throw { status: 404, message: 'Project not found.' };
  if (data.project_code && data.project_code !== project.project_code) {
    const dup = await Project.findOne({ where: { project_code: data.project_code } });
    if (dup) throw { status: 409, message: `Project code '${data.project_code}' already exists.` };
  }
  return project.update(data);
};

const remove = async (id) => {
  const project = await Project.findByPk(id);
  if (!project) throw { status: 404, message: 'Project not found.' };
  await project.destroy();
};

module.exports = { getAll, getById, create, update, remove };
