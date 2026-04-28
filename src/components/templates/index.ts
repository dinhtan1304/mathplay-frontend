import HorizonTemplate from './HorizonTemplate'
import GalaxyTemplate from './GalaxyTemplate'
import SakuraTemplate from './SakuraTemplate'
import ForestTemplate from './ForestTemplate'
import NeonTemplate from './NeonTemplate'
import BlueprintTemplate from './BlueprintTemplate'
import SunriseTemplate from './SunriseTemplate'
import OceanTemplate from './OceanTemplate'
import ChalkTemplate from './ChalkTemplate'
import PrismTemplate from './PrismTemplate'
import DaisyTemplate from './DaisyTemplate'
import MarshmallowTemplate from './MarshmallowTemplate'
import LinenTemplate from './LinenTemplate'
import OrigamiTemplate from './OrigamiTemplate'
import LullabyTemplate from './LullabyTemplate'
import HoneyTemplate from './HoneyTemplate'
import PetalTemplate from './PetalTemplate'
import CloudTemplate from './CloudTemplate'
import VanillaTemplate from './VanillaTemplate'
import PearlTemplate from './PearlTemplate'
import type { TemplateProps } from './types'

export {
  HorizonTemplate, GalaxyTemplate, SakuraTemplate, ForestTemplate, NeonTemplate,
  BlueprintTemplate, SunriseTemplate, OceanTemplate, ChalkTemplate, PrismTemplate,
  DaisyTemplate, MarshmallowTemplate, LinenTemplate, OrigamiTemplate, LullabyTemplate,
  HoneyTemplate, PetalTemplate, CloudTemplate, VanillaTemplate, PearlTemplate,
}

export type { TemplateProps }

const TEMPLATE_MAP: Record<string, React.ComponentType<TemplateProps>> = {
  horizon: HorizonTemplate,
  galaxy: GalaxyTemplate,
  sakura: SakuraTemplate,
  forest: ForestTemplate,
  neon: NeonTemplate,
  blueprint: BlueprintTemplate,
  sunrise: SunriseTemplate,
  ocean: OceanTemplate,
  chalk: ChalkTemplate,
  prism: PrismTemplate,
  daisy: DaisyTemplate,
  marshmallow: MarshmallowTemplate,
  linen: LinenTemplate,
  origami: OrigamiTemplate,
  lullaby: LullabyTemplate,
  honey: HoneyTemplate,
  petal: PetalTemplate,
  cloud: CloudTemplate,
  vanilla: VanillaTemplate,
  pearl: PearlTemplate,
}

export function getTemplateComponent(id: string): React.ComponentType<TemplateProps> {
  return TEMPLATE_MAP[id] ?? HorizonTemplate
}
