/**
 * Wikidata API Client
 *
 * Client for Wikidata SPARQL endpoint and REST API to fetch criminal case information,
 * real people involved in True Crime cases, and related factual data.
 */

import { BaseApiClient, DEFAULT_CONFIGS } from '../base/api-client.js';

// Wikidata SPARQL Response Types
interface WikidataSPARQLResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: WikidataBinding[];
  };
}

interface WikidataBinding {
  [key: string]: {
    type: 'uri' | 'literal' | 'bnode';
    value: string;
    'xml:lang'?: string;
    datatype?: string;
  };
}

// Wikidata REST API Types
interface WikidataEntityResponse {
  entities: {
    [qid: string]: WikidataEntity;
  };
  success: number;
}

interface WikidataEntity {
  type: string;
  id: string;
  labels: WikidataLanguageValues;
  descriptions: WikidataLanguageValues;
  aliases?: WikidataLanguageValues;
  claims: {
    [property: string]: WikidataClaim[];
  };
  sitelinks?: {
    [site: string]: WikidataSitelink;
  };
}

interface WikidataLanguageValues {
  [language: string]: {
    language: string;
    value: string;
  };
}

interface WikidataClaim {
  type: string;
  id: string;
  rank: 'preferred' | 'normal' | 'deprecated';
  mainsnak: WikidataStatement;
  qualifiers?: {
    [property: string]: WikidataStatement[];
  };
  references?: WikidataReference[];
}

interface WikidataStatement {
  snaktype: 'value' | 'novalue' | 'somevalue';
  property: string;
  hash?: string;
  datavalue?: WikidataDataValue;
  datatype?: string;
}

interface WikidataDataValue {
  value: any;
  type: 'string' | 'time' | 'wikibase-entityid' | 'globecoordinate' | 'quantity' | 'monolingualtext';
}

interface WikidataReference {
  hash: string;
  snaks: {
    [property: string]: WikidataStatement[];
  };
  'snaks-order': string[];
}

interface WikidataSitelink {
  site: string;
  title: string;
  badges?: string[];
  url?: string;
}

// Transformed types for internal use
export interface CriminalCase {
  wikidataId: string;
  name: string;
  description?: string;
  aliases: string[];
  type: 'murder' | 'serial_killing' | 'kidnapping' | 'fraud' | 'terrorism' | 'other';
  status: 'solved' | 'unsolved' | 'cold_case';
  dateRange: {
    start?: string;
    end?: string;
  };
  locations: LocationInfo[];
  perpetrators: PersonInfo[];
  victims: PersonInfo[];
  investigators: PersonInfo[];
  media: MediaReference[];
  relatedCases: string[];
  wikipediaUrl?: string;
  lastUpdated: string;
}

export interface PersonInfo {
  wikidataId: string;
  name: string;
  description?: string;
  aliases: string[];
  birthDate?: string;
  deathDate?: string;
  birthPlace?: LocationInfo;
  deathPlace?: LocationInfo;
  nationality: string[];
  occupation: string[];
  knownFor: string[];
  image?: string;
  wikipediaUrl?: string;
  role: 'perpetrator' | 'victim' | 'investigator' | 'witness' | 'other';
}

export interface LocationInfo {
  wikidataId?: string;
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  type: 'city' | 'state' | 'country' | 'region' | 'landmark';
  parentLocation?: string;
}

export interface MediaReference {
  type: 'book' | 'film' | 'tv_series' | 'documentary' | 'podcast' | 'article';
  title: string;
  wikidataId?: string;
  author?: string;
  publishDate?: string;
  imdbId?: string;
  tmdbId?: string;
}

export interface WikidataSearchParams {
  query: string;
  language?: string;
  limit?: number;
  offset?: number;
  type?: 'item' | 'property' | 'lexeme' | 'form' | 'sense';
}

class WikidataApiClient extends BaseApiClient {
  private static readonly SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
  private static readonly REST_ENDPOINT = 'https://www.wikidata.org/w/api.php';
  private static readonly COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';

  // Common Wikidata property IDs for True Crime research
  private static readonly PROPERTIES = {
    INSTANCE_OF: 'P31',
    SUBCLASS_OF: 'P279',
    PART_OF: 'P361',
    LOCATION: 'P276',
    POINT_IN_TIME: 'P585',
    START_TIME: 'P580',
    END_TIME: 'P582',
    PERPETRATOR: 'P8031',
    VICTIM: 'P8032',
    INVESTIGATOR: 'P8033',
    PARTICIPANT: 'P710',
    COUNTRY: 'P17',
    COORDINATE_LOCATION: 'P625',
    IMAGE: 'P18',
    WIKIPEDIA_URL: 'P4675',
    IMDB_ID: 'P345',
    TMDB_ID: 'P4947',
    DATE_OF_BIRTH: 'P569',
    DATE_OF_DEATH: 'P570',
    PLACE_OF_BIRTH: 'P19',
    PLACE_OF_DEATH: 'P20',
    OCCUPATION: 'P106',
    NATIONALITY: 'P27',
    NOTABLE_WORK: 'P800'
  };

  // Common Wikidata class IDs for criminal cases
  private static readonly CLASSES = {
    MURDER: 'Q132821',
    SERIAL_KILLING: 'Q336286',
    KIDNAPPING: 'Q185103',
    CRIMINAL_CASE: 'Q2334719',
    UNSOLVED_CASE: 'Q18671871',
    COLD_CASE: 'Q839993',
    INVESTIGATION: 'Q1229325',
    HUMAN: 'Q5',
    DOCUMENTARY_FILM: 'Q93204',
    BOOK: 'Q571',
    TV_SERIES: 'Q5398426'
  };

  constructor() {
    const config = {
      ...DEFAULT_CONFIGS.SLOW_API,
      baseURL: WikidataApiClient.SPARQL_ENDPOINT,
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'TCWatch/1.0 (https://tcwatch.app) True Crime Research Tool'
      },
      // Wikidata is generous but we should be respectful
      rateLimitConfig: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        requestsPerHour: 500
      },
      cacheConfig: {
        enabled: true,
        defaultTTL: 86400, // 24 hours - Wikidata changes slowly
        maxSize: 1000
      }
    };

    super(config);
  }

  /**
   * Search for criminal cases using SPARQL
   */
  async searchCriminalCases(query: string, limit = 50): Promise<CriminalCase[]> {
    const sparqlQuery = `
      SELECT DISTINCT ?case ?caseLabel ?caseDescription ?typeLabel ?startDate ?endDate ?locationLabel ?perpetratorLabel ?victimLabel WHERE {
        {
          ?case wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.MURDER} .
        } UNION {
          ?case wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.SERIAL_KILLING} .
        } UNION {
          ?case wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.CRIMINAL_CASE} .
        }

        ?case rdfs:label ?caseLabel .
        FILTER(LANG(?caseLabel) = "en")
        FILTER(CONTAINS(LCASE(?caseLabel), LCASE("${query}")))

        OPTIONAL { ?case schema:description ?caseDescription . FILTER(LANG(?caseDescription) = "en") }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF} ?type . }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.START_TIME} ?startDate . }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.END_TIME} ?endDate . }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.LOCATION} ?location . }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.PERPETRATOR} ?perpetrator . }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.VICTIM} ?victim . }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY ?caseLabel
      LIMIT ${limit}
    `;

    const results = await this.executeSPARQLQuery(sparqlQuery);
    return this.processCriminalCaseResults(results);
  }

  /**
   * Get detailed information about a specific criminal case
   */
  async getCriminalCaseDetails(wikidataId: string): Promise<CriminalCase | null> {
    try {
      const entity = await this.getEntityDetails(wikidataId);
      if (!entity) return null;

      return this.transformEntityToCriminalCase(entity);
    } catch (error) {
      console.error(`Failed to get criminal case details for ${wikidataId}:`, error);
      return null;
    }
  }

  /**
   * Search for people involved in criminal cases
   */
  async searchCriminalPersons(query: string, role?: 'perpetrator' | 'victim' | 'investigator'): Promise<PersonInfo[]> {
    let roleFilter = '';
    if (role === 'perpetrator') {
      roleFilter = `?person wdt:${WikidataApiClient.PROPERTIES.PART_OF}|wdt:${WikidataApiClient.PROPERTIES.PERPETRATOR} ?case .`;
    } else if (role === 'victim') {
      roleFilter = `?person wdt:${WikidataApiClient.PROPERTIES.VICTIM} ?case .`;
    } else if (role === 'investigator') {
      roleFilter = `?person wdt:${WikidataApiClient.PROPERTIES.INVESTIGATOR} ?case .`;
    }

    const sparqlQuery = `
      SELECT DISTINCT ?person ?personLabel ?personDescription ?birthDate ?deathDate ?nationalityLabel ?occupationLabel WHERE {
        ?person wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF} wd:${WikidataApiClient.CLASSES.HUMAN} .
        ?person rdfs:label ?personLabel .
        FILTER(LANG(?personLabel) = "en")
        FILTER(CONTAINS(LCASE(?personLabel), LCASE("${query}")))

        ${roleFilter}

        ?case wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.MURDER} .

        OPTIONAL { ?person schema:description ?personDescription . FILTER(LANG(?personDescription) = "en") }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.DATE_OF_BIRTH} ?birthDate . }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.DATE_OF_DEATH} ?deathDate . }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.NATIONALITY} ?nationality . }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.OCCUPATION} ?occupation . }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY ?personLabel
      LIMIT 100
    `;

    const results = await this.executeSPARQLQuery(sparqlQuery);
    return this.processPersonResults(results, role || 'other');
  }

  /**
   * Get famous serial killers and their cases
   */
  async getSerialKillers(limit = 50): Promise<PersonInfo[]> {
    const sparqlQuery = `
      SELECT DISTINCT ?person ?personLabel ?personDescription ?birthDate ?deathDate ?caseLabel WHERE {
        ?person wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF} wd:${WikidataApiClient.CLASSES.HUMAN} .
        ?person wdt:${WikidataApiClient.PROPERTIES.OCCUPATION}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:Q336286 .

        OPTIONAL { ?person schema:description ?personDescription . FILTER(LANG(?personDescription) = "en") }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.DATE_OF_BIRTH} ?birthDate . }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.DATE_OF_DEATH} ?deathDate . }
        OPTIONAL { ?person wdt:${WikidataApiClient.PROPERTIES.NOTABLE_WORK} ?case . }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY ?personLabel
      LIMIT ${limit}
    `;

    const results = await this.executeSPARQLQuery(sparqlQuery);
    return this.processPersonResults(results, 'perpetrator');
  }

  /**
   * Search for True Crime media (books, documentaries, films)
   */
  async searchTrueCrimeMedia(query: string, mediaType?: 'book' | 'film' | 'tv_series' | 'documentary'): Promise<MediaReference[]> {
    let typeFilter = '';
    if (mediaType === 'book') {
      typeFilter = `?media wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.BOOK} .`;
    } else if (mediaType === 'documentary') {
      typeFilter = `?media wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.DOCUMENTARY_FILM} .`;
    } else if (mediaType === 'tv_series') {
      typeFilter = `?media wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.TV_SERIES} .`;
    }

    const sparqlQuery = `
      SELECT DISTINCT ?media ?mediaLabel ?mediaDescription ?authorLabel ?publishDate ?imdbId ?tmdbId WHERE {
        ${typeFilter || `?media wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF} ?type .`}

        ?media rdfs:label ?mediaLabel .
        FILTER(LANG(?mediaLabel) = "en")
        FILTER(CONTAINS(LCASE(?mediaLabel), LCASE("${query}")) ||
                CONTAINS(LCASE(?mediaLabel), "true crime") ||
                CONTAINS(LCASE(?mediaLabel), "serial killer") ||
                CONTAINS(LCASE(?mediaLabel), "murder"))

        OPTIONAL { ?media schema:description ?mediaDescription . FILTER(LANG(?mediaDescription) = "en") }
        OPTIONAL { ?media wdt:P50|wdt:P57|wdt:P170 ?author . } # author, director, or creator
        OPTIONAL { ?media wdt:P577 ?publishDate . } # publication date
        OPTIONAL { ?media wdt:${WikidataApiClient.PROPERTIES.IMDB_ID} ?imdbId . }
        OPTIONAL { ?media wdt:${WikidataApiClient.PROPERTIES.TMDB_ID} ?tmdbId . }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY ?mediaLabel
      LIMIT 100
    `;

    const results = await this.executeSPARQLQuery(sparqlQuery);
    return this.processMediaResults(results);
  }

  /**
   * Get unsolved criminal cases
   */
  async getUnsolvedCases(limit = 50): Promise<CriminalCase[]> {
    const sparqlQuery = `
      SELECT DISTINCT ?case ?caseLabel ?caseDescription ?locationLabel ?startDate WHERE {
        ?case wdt:${WikidataApiClient.PROPERTIES.INSTANCE_OF}/wdt:${WikidataApiClient.PROPERTIES.SUBCLASS_OF}* wd:${WikidataApiClient.CLASSES.UNSOLVED_CASE} .

        OPTIONAL { ?case schema:description ?caseDescription . FILTER(LANG(?caseDescription) = "en") }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.LOCATION} ?location . }
        OPTIONAL { ?case wdt:${WikidataApiClient.PROPERTIES.START_TIME} ?startDate . }

        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      ORDER BY DESC(?startDate)
      LIMIT ${limit}
    `;

    const results = await this.executeSPARQLQuery(sparqlQuery);
    return this.processCriminalCaseResults(results);
  }

  /**
   * Get entity details from Wikidata REST API
   */
  async getEntityDetails(wikidataId: string): Promise<WikidataEntity | null> {
    const cacheKey = this.generateCacheKey('GET', `/entities/${wikidataId}`);

    try {
      const response = await this.makeRequest<WikidataEntityResponse>(
        {
          method: 'GET',
          baseURL: WikidataApiClient.REST_ENDPOINT,
          url: '',
          params: {
            action: 'wbgetentities',
            ids: wikidataId,
            format: 'json',
            languages: 'en',
            sitefilter: 'enwiki'
          }
        },
        cacheKey,
        86400 // Cache for 24 hours
      );

      return response.entities[wikidataId] || null;
    } catch (error) {
      console.error(`Failed to get entity details for ${wikidataId}:`, error);
      return null;
    }
  }

  /**
   * Execute SPARQL query
   */
  private async executeSPARQLQuery(query: string): Promise<WikidataSPARQLResponse> {
    const cacheKey = this.generateCacheKey('GET', '/sparql', { query });

    return this.makeRequest<WikidataSPARQLResponse>(
      {
        method: 'GET',
        url: '',
        params: {
          query,
          format: 'json'
        }
      },
      cacheKey,
      7200 // Cache for 2 hours
    );
  }

  /**
   * Process criminal case SPARQL results
   */
  private processCriminalCaseResults(results: WikidataSPARQLResponse): CriminalCase[] {
    const casesMap = new Map<string, any>();

    results.results.bindings.forEach(binding => {
      const caseUri = binding.case?.value;
      if (!caseUri) return;

      const wikidataId = caseUri.split('/').pop()!;

      if (!casesMap.has(wikidataId)) {
        casesMap.set(wikidataId, {
          wikidataId,
          name: binding.caseLabel?.value || '',
          description: binding.caseDescription?.value,
          aliases: [],
          type: this.mapCaseType(binding.typeLabel?.value),
          status: this.determineCaseStatus(binding),
          dateRange: {
            start: binding.startDate?.value,
            end: binding.endDate?.value
          },
          locations: [],
          perpetrators: [],
          victims: [],
          investigators: [],
          media: [],
          relatedCases: [],
          lastUpdated: new Date().toISOString()
        });
      }

      const caseData = casesMap.get(wikidataId);

      // Add location if present
      if (binding.locationLabel?.value && !caseData.locations.some((l: any) => l.name === binding.locationLabel.value)) {
        caseData.locations.push({
          name: binding.locationLabel.value,
          type: 'city'
        });
      }

      // Add perpetrator if present
      if (binding.perpetratorLabel?.value && !caseData.perpetrators.some((p: any) => p.name === binding.perpetratorLabel.value)) {
        caseData.perpetrators.push({
          name: binding.perpetratorLabel.value,
          role: 'perpetrator',
          aliases: [],
          nationality: [],
          occupation: [],
          knownFor: []
        });
      }

      // Add victim if present
      if (binding.victimLabel?.value && !caseData.victims.some((v: any) => v.name === binding.victimLabel.value)) {
        caseData.victims.push({
          name: binding.victimLabel.value,
          role: 'victim',
          aliases: [],
          nationality: [],
          occupation: [],
          knownFor: []
        });
      }
    });

    return Array.from(casesMap.values());
  }

  /**
   * Process person SPARQL results
   */
  private processPersonResults(results: WikidataSPARQLResponse, role: string): PersonInfo[] {
    const personsMap = new Map<string, any>();

    results.results.bindings.forEach(binding => {
      const personUri = binding.person?.value;
      if (!personUri) return;

      const wikidataId = personUri.split('/').pop()!;

      if (!personsMap.has(wikidataId)) {
        personsMap.set(wikidataId, {
          wikidataId,
          name: binding.personLabel?.value || '',
          description: binding.personDescription?.value,
          aliases: [],
          birthDate: binding.birthDate?.value,
          deathDate: binding.deathDate?.value,
          nationality: [],
          occupation: [],
          knownFor: [],
          role
        });
      }

      const personData = personsMap.get(wikidataId);

      // Add nationality if present
      if (binding.nationalityLabel?.value && !personData.nationality.includes(binding.nationalityLabel.value)) {
        personData.nationality.push(binding.nationalityLabel.value);
      }

      // Add occupation if present
      if (binding.occupationLabel?.value && !personData.occupation.includes(binding.occupationLabel.value)) {
        personData.occupation.push(binding.occupationLabel.value);
      }
    });

    return Array.from(personsMap.values());
  }

  /**
   * Process media SPARQL results
   */
  private processMediaResults(results: WikidataSPARQLResponse): MediaReference[] {
    return results.results.bindings.map(binding => ({
      type: this.mapMediaType(binding.mediaLabel?.value),
      title: binding.mediaLabel?.value || '',
      wikidataId: binding.media?.value.split('/').pop(),
      author: binding.authorLabel?.value,
      publishDate: binding.publishDate?.value,
      imdbId: binding.imdbId?.value,
      tmdbId: binding.tmdbId?.value
    }));
  }

  /**
   * Transform Wikidata entity to criminal case
   */
  private transformEntityToCriminalCase(entity: WikidataEntity): CriminalCase {
    return {
      wikidataId: entity.id,
      name: entity.labels.en?.value || '',
      description: entity.descriptions.en?.value,
      aliases: Object.values(entity.aliases?.en || {}).map(alias => alias.value),
      type: 'other',
      status: 'unsolved',
      dateRange: {},
      locations: [],
      perpetrators: [],
      victims: [],
      investigators: [],
      media: [],
      relatedCases: [],
      wikipediaUrl: entity.sitelinks?.enwiki?.url,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Map case type from Wikidata
   */
  private mapCaseType(typeLabel?: string): CriminalCase['type'] {
    if (!typeLabel) return 'other';

    const type = typeLabel.toLowerCase();
    if (type.includes('murder')) return 'murder';
    if (type.includes('serial')) return 'serial_killing';
    if (type.includes('kidnap')) return 'kidnapping';
    if (type.includes('fraud')) return 'fraud';
    if (type.includes('terror')) return 'terrorism';

    return 'other';
  }

  /**
   * Determine case status from binding data
   */
  private determineCaseStatus(binding: WikidataBinding): CriminalCase['status'] {
    // This is a simplified implementation
    // In practice, you'd need more sophisticated logic
    return 'unsolved';
  }

  /**
   * Map media type from title
   */
  private mapMediaType(title?: string): MediaReference['type'] {
    if (!title) return 'article';

    const titleLower = title.toLowerCase();
    if (titleLower.includes('documentary')) return 'documentary';
    if (titleLower.includes('book')) return 'book';
    if (titleLower.includes('series')) return 'tv_series';
    if (titleLower.includes('film') || titleLower.includes('movie')) return 'film';
    if (titleLower.includes('podcast')) return 'podcast';

    return 'article';
  }

  /**
   * Health check for Wikidata API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeSPARQLQuery('SELECT ?item WHERE { ?item wdt:P31 wd:Q5 } LIMIT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export { WikidataApiClient };