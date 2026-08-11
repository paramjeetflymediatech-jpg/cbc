import { User } from './User';
import { Hospital } from './Hospital';
import { Service } from './Service';
import { HospitalService } from './HospitalService';
import { Lead } from './Lead';
import { LeadPackage } from './LeadPackage';
import { HospitalPackage } from './HospitalPackage';
import { LeadTransaction } from './LeadTransaction';
import { Payment } from './Payment';
import { Notification } from './Notification';
import { State } from './State';
import { District } from './District';
import { City } from './City';

let isInitialized = false;

export function initAssociations() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    // User & Hospital
    if (!User.associations.hospital) {
      User.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
    }
    if (!Hospital.associations.users) {
      Hospital.hasMany(User, { foreignKey: 'hospitalId', as: 'users' });
    }

    // HospitalService
    if (!HospitalService.associations.hospital) {
      HospitalService.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
    }
    if (!HospitalService.associations.service) {
      HospitalService.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
    }
    if (!Hospital.associations.hospitalServices) {
      Hospital.hasMany(HospitalService, { foreignKey: 'hospitalId', as: 'hospitalServices' });
    }
    if (!Service.associations.hospitalServices) {
      Service.hasMany(HospitalService, { foreignKey: 'serviceId', as: 'hospitalServices' });
    }

    // Many-to-Many Direct Association
    if (!Hospital.associations.services) {
      Hospital.belongsToMany(Service, { through: HospitalService, foreignKey: 'hospitalId', otherKey: 'serviceId', as: 'services' });
    }
    if (!Service.associations.hospitals) {
      Service.belongsToMany(Hospital, { through: HospitalService, foreignKey: 'serviceId', otherKey: 'hospitalId', as: 'hospitals' });
    }

    // Lead
    if (!Lead.associations.hospital) {
      Lead.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
    }
    if (!Lead.associations.service) {
      Lead.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
    }
    if (!Hospital.associations.leads) {
      Hospital.hasMany(Lead, { foreignKey: 'hospitalId', as: 'leads' });
    }

    // Hospital Package
    if (!HospitalPackage.associations.hospital) {
      HospitalPackage.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
    }
    if (!HospitalPackage.associations.package) {
      HospitalPackage.belongsTo(LeadPackage, { foreignKey: 'packageId', as: 'package' });
    }
    if (!Hospital.associations.packages) {
      Hospital.hasMany(HospitalPackage, { foreignKey: 'hospitalId', as: 'packages' });
    }

    // Lead Transaction
    if (!LeadTransaction.associations.hospital) {
      LeadTransaction.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
    }

    // Payment
    if (!Payment.associations.hospital) {
      Payment.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });
    }
    if (!Payment.associations.package) {
      Payment.belongsTo(LeadPackage, { foreignKey: 'packageId', as: 'package' });
    }

    // State, District & City
    if (!State.associations.districts) {
      State.hasMany(District, { foreignKey: 'stateId', as: 'districts' });
    }
    if (!District.associations.state) {
      District.belongsTo(State, { foreignKey: 'stateId', as: 'state' });
    }
    if (!District.associations.cities) {
      District.hasMany(City, { foreignKey: 'districtId', as: 'cities' });
    }
    if (!City.associations.district) {
      City.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
    }
    if (!State.associations.cities) {
      State.hasMany(City, { foreignKey: 'stateId', as: 'cities' });
    }
    if (!City.associations.state) {
      City.belongsTo(State, { foreignKey: 'stateId', as: 'state' });
    }
  } catch (err) {
    console.warn('Deferred model associations initialization:', (err as Error)?.message);
  }
}

// Initialize associations
initAssociations();

export {
  User,
  Hospital,
  Service,
  HospitalService,
  Lead,
  LeadPackage,
  HospitalPackage,
  LeadTransaction,
  Payment,
  Notification,
  State,
  District,
  City,
};
