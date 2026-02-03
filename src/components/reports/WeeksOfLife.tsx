import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Heart, Globe, Sparkles, Leaf, ChevronDown, ChevronUp } from 'lucide-react';

const TRANSLATIONS = {
  "pt-BR": {
    "sectionTitle": "Minha Vida em Semanas",
    "pageSubtitle": "Uma visualização para refletir sobre a passagem do tempo",
    "birthDateQuestion": "Insira sua data de nascimento",
    "visualizeButton": "Visualizar seu tempo",
    "startOverButton": "Recomeçar",
    "lifeInWeeksTitle": "Sua vida em semanas",
    "weekHoverPast": " Uma semana do seu passado",
    "weekHoverCurrent": " Sua semana atual",
    "weekHoverFuture": " Uma semana no seu futuro potencial",
    "legendPast": "Passado",
    "legendPresent": "Presente",
    "legendFuture": "Futuro",
    "lifeHighlightsTitle": "Destaques da vida",
    "lifeHighlightsWeeks": "Você viveu",
    "lifeHighlightsWeeksEnd": "semanas, que é",
    "lifeHighlightsPercent": "de uma vida completa.",
    "lifeHighlightsDays": "São",
    "lifeHighlightsDaysEnd": "dias de experiência e aproximadamente",
    "lifeHighlightsSeasonsEnd": "estações observadas.",
    "lifeHighlightsHeartbeats": "Seu coração bateu aproximadamente",
    "lifeHighlightsHeartbeatsEnd": "vezes.",
    "lifeHighlightsBreaths": "Você respirou cerca de",
    "lifeHighlightsBreathsMiddle": "vezes e dormiu aproximadamente",
    "lifeHighlightsBreathsEnd": "horas.",
    "societalContextTitle": "Contexto social",
    "societalPopulation": "Durante sua vida, a população mundial cresceu de",
    "societalPopulationEnd": "para mais de",
    "societalPopulationFinal": "bilhões de pessoas.",
    "societalMeetings": "A pessoa média conhece cerca de",
    "societalMeetingsMiddle": "pessoas na vida. Você provavelmente já conheceu aproximadamente",
    "societalMeetingsEnd": "indivíduos.",
    "societalBirthsDeaths": "Desde seu nascimento, a humanidade experimentou aproximadamente",
    "societalBirthsMiddle": "nascimentos e",
    "societalDeathsEnd": "mortes.",
    "cosmicPerspectiveTitle": "Perspectiva cósmica",
    "cosmicEarthTravel": "Desde seu nascimento, a Terra viajou aproximadamente",
    "cosmicEarthTravelEnd": "quilômetros pelo espaço ao redor do Sol.",
    "cosmicUniverse": "O universo observável tem cerca de",
    "cosmicUniverseMiddle": "bilhões de anos-luz de diâmetro, o que significa que a luz leva",
    "cosmicUniverseMiddle2": "bilhões de anos para atravessá-lo. Toda a sua vida é apenas",
    "cosmicUniverseEnd": "da idade do universo.",
    "cosmicSolarSystem": "Durante sua vida, nosso sistema solar se moveu cerca de",
    "cosmicSolarSystemEnd": "quilômetros pela galáxia Via Láctea.",
    "naturalWorldTitle": "Mundo natural",
    "naturalLunarCycles": "Você experimentou aproximadamente",
    "naturalLunarMiddle": "ciclos lunares e",
    "naturalLunarEnd": "voltas ao redor do Sol.",
    "naturalSequoia": "Uma sequoia gigante pode viver mais de 3.000 anos. Sua idade atual é",
    "naturalSequoiaEnd": "de sua vida potencial.",
    "naturalCells": "Durante sua vida, seu corpo substituiu a maioria de suas células várias vezes. Você não é feito dos mesmos átomos com os quais nasceu."
  }
};

const t = (key: keyof typeof TRANSLATIONS["pt-BR"]) => TRANSLATIONS["pt-BR"][key] || key;

interface Stats {
  weeksLived: number;
  totalWeeks: number;
  weeksRemaining: number;
  percentageLived: number;
  daysLived: number;
  hoursSlept: number;
  heartbeats: number;
  breaths: number;
  seasons: number;
  birthYear: number;
}

export default function WeeksOfLife() {
  const [step, setStep] = useState(1);
  const [birthdate, setBirthdate] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [showHoverData, setShowHoverData] = useState(false);
  const [hoverWeek, setHoverWeek] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    highlights: false,
    societal: false,
    cosmic: false,
    natural: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const calculateStats = (date: string): Stats => {
    const birthDate = new Date(date);
    const today = new Date();
    const birthYear = birthDate.getFullYear();
    
    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    const weeksLived = Math.floor((today.getTime() - birthDate.getTime()) / msInWeek);
    
    const totalWeeks = 4160;
    const weeksRemaining = totalWeeks - weeksLived;
    const percentageLived = Math.round((weeksLived / totalWeeks) * 100);
    
    const msInDay = 1000 * 60 * 60 * 24;
    const daysLived = Math.floor((today.getTime() - birthDate.getTime()) / msInDay);
    
    const hoursSlept = Math.floor(daysLived * 8);
    const heartbeats = Math.floor(daysLived * 24 * 60 * 70);
    const breaths = Math.floor(daysLived * 24 * 60 * 16);
    const seasons = Math.floor(daysLived / 91.25);
    
    return {
      weeksLived,
      totalWeeks,
      weeksRemaining,
      percentageLived,
      daysLived,
      hoursSlept,
      heartbeats,
      breaths,
      seasons,
      birthYear
    };
  };

  const getPopulationAtYear = (year: number): number => {
    const populationData: Record<number, number> = {
      1950: 2.5, 1960: 3.0, 1970: 3.7, 1980: 4.4,
      1990: 5.3, 2000: 6.1, 2010: 6.9, 2020: 7.8, 2025: 8.1
    };
    
    const years = Object.keys(populationData).map(Number);
    const closestYear = years.reduce((prev, curr) => 
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
    );
    
    return Math.round(populationData[closestYear] * 1000000000);
  };

  const getAverageBirthsPerDay = () => 385000;
  const getAverageDeathsPerDay = () => 166000;

  const handleSubmit = () => {
    setStats(calculateStats(birthdate));
    setStep(2);
  };

  const getFormattedNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const renderWeekGrid = () => {
    if (!stats) return null;
    
    const rows = [];
    const weeksPerRow = 52;
    const totalRows = Math.ceil(stats.totalWeeks / weeksPerRow);
    
    for (let row = 0; row < totalRows; row++) {
      const weekCells = [];
      for (let col = 0; col < weeksPerRow; col++) {
        const weekNumber = row * weeksPerRow + col;
        if (weekNumber < stats.totalWeeks) {
          const isPast = weekNumber < stats.weeksLived;
          const isCurrent = weekNumber === stats.weeksLived;
          
          let cellClass = "w-1.5 h-1.5 sm:w-2 sm:h-2 m-px rounded-sm transition-all ";
          if (isPast) {
            cellClass += "bg-primary ";
          } else if (isCurrent) {
            cellClass += "bg-accent animate-pulse ";
          } else {
            cellClass += "bg-muted ";
          }
          
          weekCells.push(
            <div 
              key={weekNumber}
              className={cellClass}
              onMouseEnter={() => {
                setHoverWeek(weekNumber);
                setShowHoverData(true);
              }}
              onMouseLeave={() => setShowHoverData(false)}
            />
          );
        }
      }
      
      rows.push(
        <div key={row} className="flex">
          {weekCells}
        </div>
      );
    }
    
    return (
      <div className="mt-4 bg-card p-4 rounded-xl shadow-sm border border-border">
        <h2 className="text-base font-semibold mb-3 text-foreground">{t('lifeInWeeksTitle')}</h2>
        <div className="flex flex-col overflow-x-auto">
          {rows}
        </div>
        
        {showHoverData && hoverWeek !== null && (
          <div className="mt-3 text-sm text-muted-foreground">
            Semana {hoverWeek + 1}: 
            {hoverWeek < stats.weeksLived ? 
              t('weekHoverPast') : 
              hoverWeek === stats.weeksLived ? 
              t('weekHoverCurrent') : 
              t('weekHoverFuture')}
          </div>
        )}
        
        <div className="flex flex-wrap mt-4 text-xs gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary rounded-sm mr-2"></div>
            <span className="text-muted-foreground">{t('legendPast')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-accent rounded-sm mr-2"></div>
            <span className="text-muted-foreground">{t('legendPresent')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-muted rounded-sm mr-2"></div>
            <span className="text-muted-foreground">{t('legendFuture')}</span>
          </div>
        </div>
      </div>
    );
  };

  const CollapsibleSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: React.ComponentType<{ className?: string }>; 
    children: React.ReactNode;
  }) => (
    <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
      <button 
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expandedSections[id] && (
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );

  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <CollapsibleSection id="highlights" title={t('lifeHighlightsTitle')} icon={Heart}>
          <p>
            {t('lifeHighlightsWeeks')} <span className="text-foreground font-medium">{getFormattedNumber(stats.weeksLived)}</span> {t('lifeHighlightsWeeksEnd')} <span className="text-foreground font-medium">{stats.percentageLived}%</span> {t('lifeHighlightsPercent')}
          </p>
          <p>
            {t('lifeHighlightsDays')} <span className="text-foreground font-medium">{getFormattedNumber(stats.daysLived)}</span> {t('lifeHighlightsDaysEnd')} <span className="text-foreground font-medium">{getFormattedNumber(stats.seasons)}</span> {t('lifeHighlightsSeasonsEnd')}
          </p>
          <p>
            {t('lifeHighlightsHeartbeats')} <span className="text-foreground font-medium">{getFormattedNumber(stats.heartbeats)}</span> {t('lifeHighlightsHeartbeatsEnd')}
          </p>
          <p>
            {t('lifeHighlightsBreaths')} <span className="text-foreground font-medium">{getFormattedNumber(stats.breaths)}</span> {t('lifeHighlightsBreathsMiddle')} <span className="text-foreground font-medium">{getFormattedNumber(stats.hoursSlept)}</span> {t('lifeHighlightsBreathsEnd')}
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="societal" title={t('societalContextTitle')} icon={Globe}>
          <p>
            {t('societalPopulation')} <span className="text-foreground font-medium">{getFormattedNumber(getPopulationAtYear(stats.birthYear))}</span> {t('societalPopulationEnd')} <span className="text-foreground font-medium">8</span> {t('societalPopulationFinal')}
          </p>
          <p>
            {t('societalMeetings')} <span className="text-foreground font-medium">80.000</span> {t('societalMeetingsMiddle')} <span className="text-foreground font-medium">{getFormattedNumber(Math.round(80000 * (stats.percentageLived/100)))}</span> {t('societalMeetingsEnd')}
          </p>
          <p>
            {t('societalBirthsDeaths')} <span className="text-foreground font-medium">{getFormattedNumber(Math.round(stats.daysLived * getAverageBirthsPerDay()))}</span> {t('societalBirthsMiddle')} <span className="text-foreground font-medium">{getFormattedNumber(Math.round(stats.daysLived * getAverageDeathsPerDay()))}</span> {t('societalDeathsEnd')}
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="cosmic" title={t('cosmicPerspectiveTitle')} icon={Sparkles}>
          <p>
            {t('cosmicEarthTravel')} <span className="text-foreground font-medium">{getFormattedNumber(Math.round(stats.daysLived * 1.6 * 1000000))}</span> {t('cosmicEarthTravelEnd')}
          </p>
          <p>
            {t('cosmicUniverse')} <span className="text-foreground font-medium">93</span> {t('cosmicUniverseMiddle')} <span className="text-foreground font-medium">93</span> {t('cosmicUniverseMiddle2')} <span className="text-foreground font-medium">{(80/13800000000 * 100).toFixed(10)}%</span> {t('cosmicUniverseEnd')}
          </p>
          <p>
            {t('cosmicSolarSystem')} <span className="text-foreground font-medium">{getFormattedNumber(Math.round(stats.daysLived * 24 * 828000))}</span> {t('cosmicSolarSystemEnd')}
          </p>
        </CollapsibleSection>

        <CollapsibleSection id="natural" title={t('naturalWorldTitle')} icon={Leaf}>
          <p>
            {t('naturalLunarCycles')} <span className="text-foreground font-medium">{getFormattedNumber(Math.round(stats.daysLived / 29.53))}</span> {t('naturalLunarMiddle')} <span className="text-foreground font-medium">{getFormattedNumber(Math.floor(stats.daysLived / 365.25))}</span> {t('naturalLunarEnd')}
          </p>
          <p>
            {t('naturalSequoia')} <span className="text-foreground font-medium">{((stats.daysLived / 365.25) / 3000 * 100).toFixed(2)}%</span> {t('naturalSequoiaEnd')}
          </p>
          <p>{t('naturalCells')}</p>
        </CollapsibleSection>
      </div>
    );
  };

  const handleReset = () => {
    setBirthdate('');
    setStats(null);
    setStep(1);
    setExpandedSections({
      highlights: false,
      societal: false,
      cosmic: false,
      natural: false
    });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">{t('sectionTitle')}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t('pageSubtitle')}</p>
      
      {step === 1 ? (
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h3 className="text-sm font-medium mb-3 text-foreground">{t('birthDateQuestion')}</h3>
          <Input
            type="date"
            className="mb-3"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!birthdate}
          >
            {t('visualizeButton')}
          </Button>
        </div>
      ) : (
        <>
          {renderWeekGrid()}
          {renderStats()}
          <Button
            onClick={handleReset}
            variant="outline"
            className="mt-4 w-full"
          >
            {t('startOverButton')}
          </Button>
        </>
      )}
    </div>
  );
}
