% irrigation.pl
:- encoding(utf8).
:- dynamic sensor/3.
:- dynamic irrigation_action/5.
:- dynamic planting_mode/3.
:- dynamic plant_stage/3.
:- dynamic growth_goal/2.
:- dynamic system_type/2.

% Carrega módulos específicos
:- consult('crops/cannabis.pl').
:- consult('crops/lettuce.pl').
:- consult('crops/wheat.pl').
:- consult('crops/tomato.pl').
:- consult('crops/corn.pl').

% ... (Keep existing static knowledge and helper predicates like moisture_deficit, rainfall_factor, etc.) ...

% =========================================================
% ===========     CONHECIMENTO ESTÁTICO REAL      =========
% =========================================================
% crop(Name, root_depth_cm, opt_moisture_pct, sensitivity_1_5)
% opt_moisture_pct = Umidade ideal do solo (em % do volume) – NÃO da planta
% Valores baseados em: FAO Irrigation & Drainage Paper 56 (Kc e manejo)

crop(corn,     150, 55, 3).  % milho: raízes profundas, tolera moderada seca
crop(tomato,   40,  70, 5).  % tomate: muito sensível a estresse hídrico
crop(wheat,    120, 50, 2).  % trigo: razoavelmente tolerante
crop(lettuce,  25,  80, 5).  % alface: raiz superficial, exige alta umidade
crop(cannabis, 60,  65, 4).  % cannabis: sensível, mas não tanto quanto tomate

% =========================================================
% ---------------- CLIMAS REALISTAS -----------------------
% evap_mm_day = evapotranspiração média em mm/dia
% rain_prob = probabilidade de chuva do dia (0..1)
% Dados generalizados: ASCE-EWRI, FAO 56

climate(arid,      7.5, 0.05).   % desértico: evap alta, chuva praticamente zero
climate(temperate, 4.0, 0.20).   % temperado: evap moderada
climate(tropical,  5.5, 0.40).   % tropical úmido: evap alta + chuva frequente

% Relação cultura <-> clima típico predominante
% (só como default; ideal seria geolocalização)
crop_climate(corn,     temperate).
crop_climate(tomato,   temperate).
crop_climate(wheat,    temperate).
crop_climate(lettuce,  temperate).
crop_climate(cannabis, temperate).

% =========================================================
% ===========     REGRAS REALISTAS DE SOLO       ==========
% =========================================================
% Sensor: sensor(Type, Location, Value).

% moisture_deficit:
% Calcula déficit de umidade baseado no intervalo ideal da cultura.
% Se solo está em 40% e ideal é 70%, déficit = 30%.
% Curr = leitura do sensor, senão assume 0 (extremamente seco)
moisture_deficit(Crop, Location, Deficit) :-
    crop(Crop, _RootDepth, Opt, _Sens),
    ( sensor(soil_moisture_pct, Location, Curr) -> true ; Curr = 0 ),
    Def0 is Opt - Curr,
    ( Def0 > 0 -> Deficit = Def0 ; Deficit = 0 ).

% =========================================================
% ---------------- CHUVA REALISTA -------------------------
% 0–2 mm → irrelevante
% 2–10 mm → reduz irrigação
% >10 mm → cancela irrigação
% (Valores do manejo padrão FAO e sistemas de irrigação inteligente)

rainfall_factor(Location, Factor) :-
    ( sensor(rain_last_24h_mm, Location, R) -> true ; R = 0 ),
    % Fórmula contínua para evitar "degraus" bruscos.
    % Consideramos que 15mm de chuva anula a necessidade de irrigação.
    % Decaimento linear: 
    % 0mm -> 1.0
    % 7.5mm -> 0.5
    % 15mm -> 0.0
    Factor is max(0.0, 1.0 - (R / 15.0)).

% =========================================================
% --------- EVAPOTRANSPIRAÇÃO REALISTA (FAO56) ------------
% Normaliza ETc para um fator 0–1
% Se houver sensores de T e RH, calcula VPD (Vapor Pressure Deficit).
% Senão, usa dados climáticos estáticos.

evapotranspiration_factor(Crop, Location, Factor) :-
    ( sensor(air_temperature_c, Location, T),
      sensor(relative_humidity_pct, Location, RH) ->
        % Cálculo do VPD (kPa)
        % SVP = 0.6108 * exp((17.27 * T) / (T + 237.3))
        SVP is 0.6108 * exp((17.27 * T) / (T + 237.3)),
        VPD is SVP * (1 - RH / 100.0),
        % Normaliza VPD: 0.5 kPa (baixo) a 2.0 kPa (alto) -> 0.0 a 1.0
        % VPD alto = planta transpira mais = precisa de mais água
        Factor is min(1.0, max(0.0, (VPD - 0.3) / 1.7))
    ;
        % Fallback: Clima estático
        crop_climate(Crop, Clim),
        climate(Clim, Evap, RainProb),
        EvapNorm is min(1.0, max(0.0, (Evap - 2.0) / 6.0)),
        Factor is EvapNorm * (1.0 - RainProb) + 0.2
    ).

% =========================================================
% ------------- MODO DE PLANTIO (POTE / CAMPO) ------------
% planting_mode(Location, pot/field, LitersIfPot)
% plant_stage(Location, Stage, Week)

% =========================================================
% -------------- FATOR DE ESTÁGIO (VEG/BLOOM) -------------
% =========================================================
% Vegetativo: demanda constante, aumenta levemente com tamanho.
% Floração: demanda aumenta no início (stretch) e pico, cai no final.

stage_factor(Location, Factor) :-
    ( plant_stage(Location, Stage, Week) ->
        calculate_stage_factor(Stage, Week, Factor)
    ;
        Factor = 1.0 % Default se não informado
    ).

calculate_stage_factor(seedling, _Week, 1.0).   % Seedling / Muda
calculate_stage_factor(vegetative, _Week, 1.1). % Veg padrão

calculate_stage_factor(blooming, Week, Factor) :-
    ( Week =< 2 -> Factor = 1.2 ;   % Início floração (stretch)
      Week =< 6 -> Factor = 1.4 ;   % Pico floração
      Factor = 0.9                  % Final (maturação/flush)
    ).

% =========================================================
% ===========     CÁLCULO REALISTA DE VOLUME     ==========
% =========================================================
% Para CAMPO:
% Cada 1 mm de irrigação = 1 L por m².
% Convertendo profundidade radicular para mm úteis de água:
% 1 cm de solo armazena ~1.5 a 2.0 mm de água disponível (FAO)
% Usaremos 1.7 mm/cm como valor médio.

sugestao_volume_liters(Crop, Location, VolumeL) :-
    moisture_deficit(Crop, Location, DefPct),
    DefFrac is DefPct / 100.0,
    ( planting_mode(Location, pot, PotSizeL) ->
        % Em vaso: volume proporcional ao tamanho
        VolumeL is PotSizeL * DefFrac
    ;
        % Em campo:
        crop(Crop, RootDepthCm, _Opt, _Sens),
        EffectiveDepthCm is min(RootDepthCm, 60),  % capilaridade + zona úmida útil
        MmAvailable is EffectiveDepthCm * 1.7,
        VolumeL is DefFrac * MmAvailable
    ).

% =========================================================
% ===========  SCORE DE IRRIGAÇÃO AJUSTADO FAO ============
% =========================================================
%
% Pesos realistas:
%  • Umidade do solo:       60%
%  • Evapotranspiração:     25%
%  • Sensibilidade cultura: 15%
%
% Chuva modula multiplicando.

irrigation_score(Crop, Location, Score) :-
    moisture_deficit(Crop, Location, DefPct),
    rainfall_factor(Location, RF),
    evapotranspiration_factor(Crop, Location, EF),
    stage_factor(Location, SF),
    crop(Crop, _R, _Opt, Sens),

    UWeight = 0.50,
    EWeight = 0.20,
    SWeight = 0.15,
    StWeight = 0.15,

    UScore is min(100, DefPct) * UWeight,
    EScore is EF * 100.0 * EWeight,
    SScore is (Sens / 5.0) * 100.0 * SWeight,
    StScore is (SF / 1.5) * 100.0 * StWeight, % Normalizando SF (max ~1.5)

    Raw is (UScore + EScore + SScore + StScore) * RF,
    Score is round(Raw).

% =========================================================
% ----------------- DECISÃO REALISTA -----------------------
% >60  → irrigar agora
% 30–60 → verificar / irrigação leve
% <30  → não irrigar

% Dispatcher para lógica específica
irrigation_decision(Crop, Location, decision(Need, Score, VolumeL, Advice)) :-
    ( Crop == cannabis -> cannabis_recommendation(Location, Score, VolumeL, Advice)
    ; Crop == lettuce  -> lettuce_recommendation(Location, Score, VolumeL, Advice)
    ; Crop == wheat    -> wheat_recommendation(Location, Score, VolumeL, Advice)
    ; Crop == tomato   -> tomato_recommendation(Location, Score, VolumeL, Advice)
    ; Crop == corn     -> corn_recommendation(Location, Score, VolumeL, Advice)
    ; 
        % Fallback Genérico
        irrigation_score(Crop, Location, Score),
        suggest_volume_for_score(Crop, Location, Score, VolumeL),
        Advice = 'Recomendação padrão.'
    ),
    
    ( Score >= 60 -> Need = yes ;
      Score >= 30 -> Need = maybe ;
                     Need = no ).

suggest_volume_for_score(Crop, Location, Score, VolumeL) :-
    ( Score =< 30 -> VolumeL = 0.0 ;
      Score =< 60 -> suggestion_fraction(0.5, Crop, Location, VolumeL) ;
                     suggestion_fraction(1.0, Crop, Location, VolumeL) ).

suggestion_fraction(Fraction, Crop, Location, VolumeL) :-
    sugestao_volume_liters(Crop, Location, Full),
    VolumeL is round(Full * Fraction).

% =========================================================
% ------------------ REGISTRO DE AÇÕES ---------------------
% =========================================================

perform_irrigation(Location, Crop, VolumeL, Reason) :-
    get_time(Ts),
    assertz(irrigation_action(Location, Ts, Crop, VolumeL, Reason)),
    open('irrigation_log.txt', append, Out),
    format_time(atom(TimeS), '%Y-%m-%d %H:%M:%S', Ts),
    format(Out, "~w,~w,~w,~w,~w~n", [TimeS, Location, Crop, VolumeL, Reason]),
    close(Out).
