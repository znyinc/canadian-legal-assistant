import { Authority } from '../core/models';

export const initialAuthorities: Authority[] = [
  {
    id: 'ON-OCJ',
    name: 'Ontario Court of Justice',
    type: 'court',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 30,
    escalationRoutes: ['ON-SC']
  },
  {
    id: 'ON-LTB',
    name: 'Landlord and Tenant Board',
    type: 'tribunal',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 30,
    escalationRoutes: ['ON-DivCt']
  },
  {
    id: 'ON-HRTO',
    name: 'Human Rights Tribunal of Ontario',
    type: 'tribunal',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 30,
    escalationRoutes: ['ON-DivCt']
  },
  {
    id: 'ON-SMALL',
    name: 'Small Claims Court (Ontario)',
    type: 'court',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 60,
    escalationRoutes: ['ON-SC']
  },
  {
    id: 'ON-SC',
    name: 'Superior Court of Justice (Ontario)',
    type: 'court',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 60,
    escalationRoutes: ['ON-CA']
  },
  {
    id: 'ON-SC-Probate',
    name: 'Superior Court of Justice (Ontario) — Estates/Probate',
    type: 'court',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 60,
    escalationRoutes: ['ON-CA']
  },
  {
    id: 'ON-DivCt',
    name: 'Divisional Court (Ontario)',
    type: 'court',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 60,
    escalationRoutes: ['ON-CA']
  },
  {
    id: 'ON-CA',
    name: 'Court of Appeal for Ontario',
    type: 'court',
    jurisdiction: 'Ontario',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 90,
    escalationRoutes: ['CA-SCC']
  },
  {
    id: 'CA-FC',
    name: 'Federal Court',
    type: 'court',
    jurisdiction: 'Federal',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 90,
    escalationRoutes: ['CA-FCA']
  },
  {
    id: 'CA-FCA',
    name: 'Federal Court of Appeal',
    type: 'court',
    jurisdiction: 'Federal',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 120,
    escalationRoutes: ['CA-SCC']
  },
  {
    id: 'CA-TCC',
    name: 'Tax Court of Canada',
    type: 'court',
    jurisdiction: 'Federal',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 90,
    escalationRoutes: ['CA-FCA']
  },
  {
    id: 'CA-SCC',
    name: 'Supreme Court of Canada',
    type: 'court',
    jurisdiction: 'Federal',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updateCadenceDays: 180,
    escalationRoutes: []
  }
];
