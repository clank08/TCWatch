/**
 * External API Types for TCWatch
 *
 * Comprehensive type definitions for all external APIs integrated with TCWatch.
 * Includes types for Watchmode, TMDb, TheTVDB, TVMaze, and Wikidata APIs.
 */

// =============================================================================
// AGGREGATED CONTENT TYPES (Internal unified format)
// =============================================================================

export interface AggregatedContent {
  // Core metadata
  title: string;
  originalTitle: string;
  description: string;
  contentType: 'movie' | 'tv_series' | 'documentary' | 'podcast';

  // Release information
  releaseDate?: string;
  endDate?: string;
  runtimeMinutes?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  status?: string;

  // Media and imagery
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;

  // Classification and discovery
  genreTags: string[];
  caseTags: string[];
  keywords: string[];

  // External identifiers
  externalIds: {
    watchmode?: number;
    tmdb?: number;
    tvdb?: number;
    tvmaze?: number;
    imdb?: string;
  };

  // Platform availability
  platforms: PlatformAvailability[];

  // Cast and crew (limited to key people)
  cast: PersonCredit[];
  crew: PersonCredit[];

  // Ratings and popularity
  ratings: {
    tmdb?: number;
    tvdb?: number;
    tvmaze?: number;
    user?: number;
  };
  popularity?: number;

  // True Crime specific
  relatedCases: RelatedCase[];
  factualBasis?: {
    isBasedOnTrueEvents: boolean;
    historicalAccuracy?: 'high' | 'medium' | 'low' | 'dramatized';
    timelineAccuracy?: 'accurate' | 'compressed' | 'altered';
  };

  // Metadata
  lastSyncedAt: string;
  sourceConfidence: number; // 0-1 score indicating data quality/confidence
  dataCompleteness: number; // 0-1 score indicating how complete the data is
}

export interface PlatformAvailability {
  platformId: number;
  platformName: string;
  type: 'subscription' | 'free' | 'purchase' | 'rent';
  region: string;
  availableUntil?: string;
  price?: number;
  currency?: string;
  quality: 'SD' | 'HD' | 'UHD';
  urls: {
    web?: string;
    ios?: string;
    android?: string;
  };
  seasons?: number[];
  episodes?: number[];
}

export interface PersonCredit {
  id?: number;
  name: string;
  role: string; // character name for cast, job title for crew
  department?: string; // for crew: 'Directing', 'Writing', 'Producing', etc.
  profileImage?: string;
  isMainCast?: boolean;
  wikidataId?: string; // for real people involved in True Crime cases
}

export interface RelatedCase {
  caseId?: string; // Internal case ID
  wikidataId?: string;
  caseName: string;
  relationship: 'directly_based_on' | 'inspired_by' | 'covers_case' | 'features_person' | 'same_perpetrator' | 'same_location';
  confidence: number; // 0-1 score
}

// =============================================================================
// WATCHMODE API TYPES
// =============================================================================

export interface WatchmodeTitle {
  id: number;
  title: string;
  original_title: string;
  plot_overview: string;
  type: 'movie' | 'tv_series' | 'tv_miniseries' | 'tv_special' | 'short_film';
  runtime_minutes?: number;
  year: number;
  end_year?: number;
  release_date: string;
  imdb_id: string;
  tmdb_id: number;
  tmdb_type: 'movie' | 'tv';
  genre_names: string[];
  user_rating: number;
  critic_score: number;
  us_rating: string;
  poster: string;
  backdrop: string;
  original_language: string;
  similar_titles: number[];
  sources: WatchmodeSource[];
  trailer: string;
  trailer_thumbnail: string;
}

export interface WatchmodeSource {
  source_id: number;
  name: string;
  type: 'sub' | 'free' | 'purchase' | 'rent';
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format: '4K' | 'HD' | 'SD';
  price?: number;
  seasons?: number[];
  episodes?: number[];
}

export interface WatchmodeSearchResponse {
  titles: WatchmodeTitle[];
  total_results: number;
  total_pages: number;
}

export interface WatchmodeNetwork {
  id: number;
  name: string;
  type: 'sub' | 'free' | 'purchase' | 'rent';
  logo_100px: string;
  ios_appstore_url?: string;
  android_playstore_url?: string;
  website_url?: string;
}

// =============================================================================
// TMDB API TYPES
// =============================================================================

export interface TMDbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  poster_path?: string;
  backdrop_path?: string;
  imdb_id?: string;
  genre_ids: number[];
  genres?: TMDbGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  spoken_languages?: TMDbLanguage[];
  production_companies?: TMDbCompany[];
  production_countries?: TMDbCountry[];
  status: string;
  tagline?: string;
  homepage?: string;
  budget?: number;
  revenue?: number;
  videos?: TMDbVideosResponse;
  credits?: TMDbCreditsResponse;
  keywords?: TMDbKeywordsResponse;
  similar?: TMDbSearchResponse<TMDbMovie>;
  recommendations?: TMDbSearchResponse<TMDbMovie>;
}

export interface TMDbTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date?: string;
  episode_run_time: number[];
  number_of_episodes: number;
  number_of_seasons: number;
  poster_path?: string;
  backdrop_path?: string;
  genre_ids: number[];
  genres?: TMDbGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  spoken_languages?: TMDbLanguage[];
  production_companies?: TMDbCompany[];
  production_countries?: TMDbCountry[];
  status: string;
  tagline?: string;
  homepage?: string;
  in_production: boolean;
  type: string;
  videos?: TMDbVideosResponse;
  credits?: TMDbCreditsResponse;
  keywords?: TMDbKeywordsResponse;
  similar?: TMDbSearchResponse<TMDbTVShow>;
  recommendations?: TMDbSearchResponse<TMDbTVShow>;
  seasons?: TMDbSeason[];
  created_by?: TMDbCreator[];
  networks?: TMDbNetwork[];
  origin_country: string[];
}

export interface TMDbPerson {
  id: number;
  name: string;
  also_known_as: string[];
  biography: string;
  birthday?: string;
  deathday?: string;
  gender: number;
  known_for_department: string;
  place_of_birth?: string;
  popularity: number;
  profile_path?: string;
  adult: boolean;
  imdb_id?: string;
  homepage?: string;
  movie_credits?: TMDbCreditsResponse;
  tv_credits?: TMDbCreditsResponse;
  combined_credits?: TMDbCreditsResponse;
}

export interface TMDbGenre {
  id: number;
  name: string;
}

export interface TMDbLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDbCompany {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

export interface TMDbCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
  size: number;
}

export interface TMDbVideosResponse {
  results: TMDbVideo[];
}

export interface TMDbCast {
  id: number;
  cast_id: number;
  character: string;
  credit_id: string;
  gender: number;
  name: string;
  order: number;
  popularity: number;
  profile_path?: string;
}

export interface TMDbCrew {
  id: number;
  credit_id: string;
  department: string;
  gender: number;
  job: string;
  name: string;
  popularity: number;
  profile_path?: string;
}

export interface TMDbCreditsResponse {
  cast: TMDbCast[];
  crew: TMDbCrew[];
}

export interface TMDbKeyword {
  id: number;
  name: string;
}

export interface TMDbKeywordsResponse {
  keywords?: TMDbKeyword[];
  results?: TMDbKeyword[];
}

export interface TMDbSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDbSeason {
  id: number;
  air_date?: string;
  episode_count: number;
  name: string;
  overview: string;
  poster_path?: string;
  season_number: number;
}

export interface TMDbCreator {
  id: number;
  name: string;
  gender: number;
  profile_path?: string;
  credit_id: string;
}

export interface TMDbNetwork {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

// =============================================================================
// THETVDB API TYPES
// =============================================================================

export interface TVDBSeries {
  id: number;
  name: string;
  slug: string;
  image?: string;
  nameTranslations: string[];
  overviewTranslations: string[];
  aliases: TVDBAlias[];
  firstAired: string;
  lastAired?: string;
  nextAired?: string;
  score: number;
  status: TVDBSeriesStatus;
  originalCountry: string;
  originalLanguage: string;
  defaultSeasonType: number;
  isOrderRandomized: boolean;
  lastUpdated: string;
  averageRuntime: number;
  episodes?: TVDBEpisode[];
  seasons?: TVDBSeason[];
  genres?: TVDBGenre[];
  companies?: TVDBCompany[];
  originalNetwork?: TVDBNetwork;
  latestNetwork?: TVDBNetwork;
  lists?: TVDBList[];
  remoteIds?: TVDBRemoteId[];
  characters?: TVDBCharacter[];
  artworks?: TVDBArtwork[];
  translations?: TVDBTranslation[];
}

export interface TVDBEpisode {
  id: number;
  seriesId: number;
  name?: string;
  aired?: string;
  runtime?: number;
  nameTranslations?: string[];
  overview?: string;
  overviewTranslations?: string[];
  image?: string;
  imageType?: number;
  isMovie?: boolean;
  seasons?: TVDBSeasonBaseRecord[];
  number: number;
  seasonNumber: number;
  absoluteNumber?: number;
  airsAfterSeason?: number;
  airsBeforeEpisode?: number;
  airsBeforeSeason?: number;
  finaleType?: string;
  lastUpdated: string;
  linkedMovie?: number;
  year?: string;
  awards?: TVDBAward[];
  characters?: TVDBCharacter[];
  companies?: TVDBCompany[];
  networks?: TVDBNetwork[];
  nominations?: TVDBNomination[];
  remoteIds?: TVDBRemoteId[];
  seasons_?: TVDBSeason[];
  tagOptions?: TVDBTagOption[];
  trailers?: TVDBTrailer[];
  translations?: TVDBTranslation[];
}

export interface TVDBSeason {
  id: number;
  seriesId: number;
  type: TVDBSeasonType;
  number: number;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  image?: string;
  imageType?: number;
  companies?: TVDBCompany[];
  episodes?: TVDBEpisode[];
  lastUpdated: string;
  name?: string;
  overview?: string;
  year?: string;
  artwork?: TVDBArtwork[];
  tagOptions?: TVDBTagOption[];
  trailers?: TVDBTrailer[];
  translations?: TVDBTranslation[];
}

export interface TVDBAlias {
  language: string;
  name: string;
}

export interface TVDBSeriesStatus {
  id: number;
  name: string;
  recordType: string;
  keepUpdated: boolean;
}

export interface TVDBGenre {
  id: number;
  name: string;
  slug: string;
}

export interface TVDBCompany {
  id: number;
  name: string;
  slug: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  country: string;
  primaryCompanyType: number;
  activeDate?: string;
  inactiveDate?: string;
  tags?: TVDBTag[];
  parentCompany?: TVDBCompany;
  tagOptions?: TVDBTagOption[];
}

export interface TVDBNetwork {
  id: number;
  name: string;
  slug: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  country: string;
  abbreviation?: string;
}

export interface TVDBList {
  id: number;
  name: string;
  overview?: string;
  url?: string;
  isOfficial: boolean;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  score: number;
  image?: string;
  imageIsFallback?: boolean;
  remoteIds?: TVDBRemoteId[];
  tags?: TVDBTag[];
}

export interface TVDBRemoteId {
  id: string;
  type: number;
  sourceName: string;
}

export interface TVDBCharacter {
  id: number;
  name: string;
  peopleId?: number;
  seriesId?: number;
  series?: TVDBSeries;
  movie?: number;
  movieId?: number;
  episodeId?: number;
  type?: number;
  image?: string;
  sort: number;
  isFeatured: boolean;
  url?: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  peopleType: string;
  personName?: string;
  tagOptions?: TVDBTagOption[];
  personImgURL?: string;
}

export interface TVDBArtwork {
  id: number;
  image: string;
  thumbnail: string;
  language?: string;
  type: number;
  score: number;
  width: number;
  height: number;
  includesText: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
  updatedAt: number;
  status: TVDBStatus;
  tagOptions?: TVDBTagOption[];
}

export interface TVDBTranslation {
  aliases?: string[];
  isAlias?: boolean;
  isPrimary?: boolean;
  language: string;
  name?: string;
  overview?: string;
  tagline?: string;
}

export interface TVDBSeasonBaseRecord {
  id: number;
  seriesId: number;
  type: TVDBSeasonType;
  number: number;
}

export interface TVDBSeasonType {
  id: number;
  name: string;
  type: string;
}

export interface TVDBAward {
  id: number;
  name: string;
  year?: string;
  category?: string;
  details?: string;
  nominee?: string;
}

export interface TVDBNomination {
  id: number;
  name: string;
  year?: string;
  category?: string;
  details?: string;
  nominee?: string;
}

export interface TVDBTagOption {
  id: number;
  tag: number;
  tagId: number;
  tagName: string;
  name: string;
  helpText?: string;
}

export interface TVDBTrailer {
  id: number;
  name: string;
  url: string;
  language: string;
  runtime: number;
}

export interface TVDBTag {
  id: number;
  name: string;
  helpText?: string;
  options?: TVDBTagOption[];
}

export interface TVDBStatus {
  id: number;
  name: string;
}

export interface TVDBSearchResponse {
  data: TVDBSeries[];
  status: string;
  links?: {
    prev?: string;
    self?: string;
    next?: string;
    total_items: number;
    page_size: number;
  };
}

// =============================================================================
// TVMAZE API TYPES
// =============================================================================

export interface TVMazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime?: number;
  averageRuntime?: number;
  premiered?: string;
  ended?: string;
  officialSite?: string;
  schedule: TVMazeSchedule;
  rating: TVMazeRating;
  weight: number;
  network?: TVMazeNetwork;
  webChannel?: TVMazeWebChannel;
  dvdCountry?: TVMazeCountry;
  externals: TVMazeExternals;
  image?: TVMazeImage;
  summary?: string;
  updated: number;
  _links?: TVMazeLinks;
  _embedded?: {
    episodes?: TVMazeEpisode[];
    seasons?: TVMazeSeason[];
    cast?: TVMazeCastMember[];
    crew?: TVMazeCrewMember[];
    akas?: TVMazeAka[];
    nextepisode?: TVMazeEpisode;
    previousepisode?: TVMazeEpisode;
  };
}

export interface TVMazeEpisode {
  id: number;
  url: string;
  name: string;
  season: number;
  number?: number;
  type: string;
  airdate?: string;
  airtime?: string;
  airstamp?: string;
  runtime?: number;
  rating: TVMazeRating;
  image?: TVMazeImage;
  summary?: string;
  _links?: TVMazeLinks;
  _embedded?: {
    show?: TVMazeShow;
  };
}

export interface TVMazeSeason {
  id: number;
  url: string;
  number: number;
  name?: string;
  episodeOrder?: number;
  premiereDate?: string;
  endDate?: string;
  network?: TVMazeNetwork;
  webChannel?: TVMazeWebChannel;
  image?: TVMazeImage;
  summary?: string;
  _links?: TVMazeLinks;
}

export interface TVMazeSchedule {
  time: string;
  days: string[];
}

export interface TVMazeRating {
  average?: number;
}

export interface TVMazeNetwork {
  id: number;
  name: string;
  country: TVMazeCountry;
  officialSite?: string;
}

export interface TVMazeWebChannel {
  id: number;
  name: string;
  country?: TVMazeCountry;
  officialSite?: string;
}

export interface TVMazeCountry {
  name: string;
  code: string;
  timezone: string;
}

export interface TVMazeExternals {
  tvrage?: number;
  thetvdb?: number;
  imdb?: string;
}

export interface TVMazeImage {
  medium: string;
  original: string;
}

export interface TVMazeLinks {
  self?: { href: string };
  nextepisode?: { href: string };
  previousepisode?: { href: string };
}

export interface TVMazeCastMember {
  person: TVMazePerson;
  character: TVMazeCharacter;
  self: boolean;
  voice: boolean;
}

export interface TVMazeCrewMember {
  type: string;
  person: TVMazePerson;
}

export interface TVMazePerson {
  id: number;
  url: string;
  name: string;
  country?: TVMazeCountry;
  birthday?: string;
  deathday?: string;
  gender?: string;
  image?: TVMazeImage;
  updated: number;
  _links?: TVMazeLinks;
}

export interface TVMazeCharacter {
  id: number;
  url: string;
  name: string;
  image?: TVMazeImage;
  _links?: TVMazeLinks;
}

export interface TVMazeAka {
  name: string;
  country: TVMazeCountry;
}

export interface TVMazeSearchResult {
  score: number;
  show: TVMazeShow;
}

// =============================================================================
// WIKIDATA API TYPES
// =============================================================================

export interface WikidataSPARQLResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: WikidataBinding[];
  };
}

export interface WikidataBinding {
  [key: string]: {
    type: 'uri' | 'literal' | 'bnode';
    value: string;
    'xml:lang'?: string;
    datatype?: string;
  };
}

export interface WikidataEntityResponse {
  entities: {
    [qid: string]: WikidataEntity;
  };
  success: number;
}

export interface WikidataEntity {
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

export interface WikidataLanguageValues {
  [language: string]: {
    language: string;
    value: string;
  };
}

export interface WikidataClaim {
  type: string;
  id: string;
  rank: 'preferred' | 'normal' | 'deprecated';
  mainsnak: WikidataStatement;
  qualifiers?: {
    [property: string]: WikidataStatement[];
  };
  references?: WikidataReference[];
}

export interface WikidataStatement {
  snaktype: 'value' | 'novalue' | 'somevalue';
  property: string;
  hash?: string;
  datavalue?: WikidataDataValue;
  datatype?: string;
}

export interface WikidataDataValue {
  value: any;
  type: 'string' | 'time' | 'wikibase-entityid' | 'globecoordinate' | 'quantity' | 'monolingualtext';
}

export interface WikidataReference {
  hash: string;
  snaks: {
    [property: string]: WikidataStatement[];
  };
  'snaks-order': string[];
}

export interface WikidataSitelink {
  site: string;
  title: string;
  badges?: string[];
  url?: string;
}

// =============================================================================
// TRUE CRIME SPECIFIC TYPES
// =============================================================================

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

// =============================================================================
// SEARCH PARAMETER TYPES
// =============================================================================

export interface WatchmodeSearchParams {
  search_field?: 'name' | 'imdb_id' | 'tmdb_id';
  search_value: string;
  types?: ('movie' | 'tv_series' | 'tv_miniseries' | 'tv_special' | 'short_film')[];
  genres?: string[];
  regions?: string[];
  source_types?: ('sub' | 'free' | 'purchase' | 'rent')[];
  source_ids?: number[];
  year_min?: number;
  year_max?: number;
  imdb_rating_min?: number;
  imdb_rating_max?: number;
  sort_by?: 'relevance_desc' | 'popularity_desc' | 'release_date_desc' | 'name_asc';
  page?: number;
}

export interface TMDbSearchParams {
  query: string;
  page?: number;
  year?: number;
  primary_release_year?: number;
  first_air_date_year?: number;
  region?: string;
  include_adult?: boolean;
}

export interface TVDBSearchParams {
  query?: string;
  type?: 'series' | 'movie' | 'person' | 'company';
  year?: number;
  company?: string;
  country?: string;
  director?: string;
  language?: string;
  network?: string;
  primaryType?: string;
  status?: string;
  genre?: string;
  offset?: number;
  limit?: number;
}

export interface WikidataSearchParams {
  query: string;
  language?: string;
  limit?: number;
  offset?: number;
  type?: 'item' | 'property' | 'lexeme' | 'form' | 'sense';
}

// =============================================================================
// API CLIENT CONFIGURATION TYPES
// =============================================================================

export interface ExternalAPIConfig {
  watchmodeApiKey?: string;
  tmdbApiKey?: string;
  tvdbApiKey?: string;
  tvdbPin?: string;
  // TVMaze and Wikidata don't require API keys
}

// =============================================================================
// CIRCUIT BREAKER AND RESILIENCE TYPES
// =============================================================================

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // seconds
  maxSize: number;
}