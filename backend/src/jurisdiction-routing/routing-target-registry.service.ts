import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RoutingTargetRegistryService implements OnModuleInit {
  private stationsData: any[] = [];
  private stationsMap = new Map<string, string>(); // stationCode -> DB id

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedAndLoadRegistry();
  }

  private getDatasetPath(): string {
    const pathsToTry = [
      path.resolve(process.cwd(), 'shared/jurisdiction-data'),
      path.resolve(__dirname, '../../shared/jurisdiction-data'),
      path.resolve(__dirname, '../../../shared/jurisdiction-data'),
    ];

    for (const p of pathsToTry) {
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'manifest.json'))) {
        return p;
      }
    }
    return '';
  }

  async seedAndLoadRegistry() {
    const dataDir = this.getDatasetPath();
    if (!dataDir) return;

    const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'manifest.json'), 'utf8'));
    const version = manifest.version;

    // Seed Version registry
    await this.prisma.jurisdictionRegistryVersion.upsert({
      where: { version },
      update: {},
      create: { version, description: manifest.description },
    });

    const versionRecord = await this.prisma.jurisdictionRegistryVersion.findUnique({
      where: { version },
    });
    if (!versionRecord) return;

    this.stationsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'stations.json'), 'utf8'));

    // Seed PoliceStation records
    for (const station of this.stationsData) {
      const dbStation = await this.prisma.policeStation.upsert({
        where: { stationCode: station.stationCode },
        update: {
          name: station.name,
          districtCode: station.districtCode,
          cityCode: station.cityCode,
          localityCode: station.localityCode,
          latitude: station.latitude,
          longitude: station.longitude,
          phone: station.phone,
          isActive: station.isActive,
        },
        create: {
          stationCode: station.stationCode,
          name: station.name,
          districtCode: station.districtCode,
          cityCode: station.cityCode,
          localityCode: station.localityCode,
          latitude: station.latitude,
          longitude: station.longitude,
          phone: station.phone,
          isActive: station.isActive,
        },
      });
      this.stationsMap.set(station.stationCode, dbStation.id);
    }

    // Seed mappings
    const mappings = JSON.parse(fs.readFileSync(path.join(dataDir, 'jurisdiction-mappings').concat('.json'), 'utf8'));
    for (const mapping of mappings) {
      const stationId = this.stationsMap.get(mapping.stationCode);
      if (stationId) {
        // Create unique identifier check or recreate mappings
        const existingMapping = await this.prisma.jurisdictionMapping.findFirst({
          where: {
            districtCode: mapping.districtCode,
            cityCode: mapping.cityCode,
            localityCode: mapping.localityCode,
            policeStationId: stationId,
            registryVersionId: versionRecord.id,
          },
        });

        if (!existingMapping) {
          await this.prisma.jurisdictionMapping.create({
            data: {
              districtCode: mapping.districtCode,
              cityCode: mapping.cityCode,
              localityCode: mapping.localityCode,
              policeStationId: stationId,
              priority: mapping.priority,
              registryVersionId: versionRecord.id,
            },
          });
        }
      }
    }
  }

  getStationIdByCode(code: string): string | undefined {
    return this.stationsMap.get(code);
  }

  async validateTarget(targetType: string, targetId: string): Promise<boolean> {
    if (targetType === 'POLICE_STATION' || targetType === 'CYBER_CELL' || targetType === 'VERIFICATION_UNIT') {
      const station = await this.prisma.policeStation.findUnique({
        where: { id: targetId },
      });
      return !!station;
    }
    return true;
  }
}
