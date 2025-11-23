% Cannabis-specific irrigation rules apenas um teste.

:- discontiguous cannabis_target_ec/4.
:- discontiguous cannabis_target_input_ec/4.
% cannabis.pl
:- encoding(utf8).

% EC Targets for Drain (Output)
% cannabis_target_ec(Stage, Week, MinEC, MaxEC)

% Seedling / Clones
cannabis_target_ec(seedling, _Week, 1.2, 1.6).
cannabis_target_input_ec(seedling, _Week, 1.2, 1.6).

% Vegetative (Veg to Flip)
cannabis_target_ec(vegetative, _Week, 2.2, 2.4). 
cannabis_target_input_ec(vegetative, _Week, 2.0, 2.2).

% Floração (Weeks) - Drain Targets
cannabis_target_ec(blooming, Week, 1.8, 2.4) :- Week = 1.
cannabis_target_ec(blooming, Week, 1.6, 1.8) :- Week >= 2, Week =< 3.
cannabis_target_ec(blooming, Week, 2.0, 2.6) :- Week = 4.
cannabis_target_ec(blooming, Week, 2.0, 2.6) :- Week >= 5, Week =< 7.
cannabis_target_ec(blooming, Week, 1.8, 2.3) :- Week >= 8.

% Floração (Weeks) - Input Targets
cannabis_target_input_ec(blooming, Week, 2.0, 2.2) :- Week = 1.
cannabis_target_input_ec(blooming, Week, 1.6, 1.7) :- Week >= 2, Week =< 3.
cannabis_target_input_ec(blooming, Week, 1.9, 2.2) :- Week = 4.
cannabis_target_input_ec(blooming, Week, 2.0, 2.2) :- Week >= 5, Week =< 7.
cannabis_target_input_ec(blooming, Week, 1.8, 1.9) :- Week >= 8.

% Fallback
cannabis_target_ec(_, _, 1.5, 2.5).
cannabis_target_input_ec(_, _, 1.5, 2.5).

cannabis_recommendation(Location, Score, VolumeL, Advice) :-
    plant_stage(Location, Stage, Week),
    ( sensor(ec, Location, EC) -> true ; EC = 0 ), % Se não tiver sensor, ignora checagem de flush
    
    cannabis_target_ec(Stage, Week, MinDrain, MaxDrain),
    cannabis_target_input_ec(Stage, Week, MinInput, MaxInput),
    
    % Lógica de Flush vs Steering
    ( EC > MaxDrain + 0.2 ->
        % EC Crítico -> Flush
        format(atom(AdviceBase), 'ALERTA: EC muito alto! Realizar FLUSH.~nMeta Input: ~1f-~1f~nMeta Saida: ~1f-~1f.', [MinInput, MaxInput, MinDrain, MaxDrain]),
        ScoreMod = 1.5, % Aumenta volume para lavar o solo
        Steering = flush
    ; EC > 0, EC < MinDrain - 0.3 ->
        AdviceBase = 'EC baixo. Aumentar concentração de nutrientes.',
        ScoreMod = 1.0,
        Steering = feed
    ;
        % EC dentro do alvo -> Segue Steering Padrão
        Steering = normal,
        ScoreMod = 1.0
    ),
    
    ( Steering == flush ->
        true % Advice já definido
    ; Steering == feed ->
        true
    ;
        % Lógica de Steering Normal (se EC ok)
        ( Stage == blooming ->
            ( EC > 2.0 ->
                AdviceBase = 'Blooming: Generative Steering (Dry-backs acentuados).',
                FinalMod = 0.9
            ;
                AdviceBase = 'Blooming: Manter parâmetros.',
                FinalMod = 1.0
            )
        ; Stage == seedling ->
            AdviceBase = 'Seedling: Manter umidade alta e constante.',
            FinalMod = 1.2
        ; % Vegetative
            AdviceBase = 'Vegetative: Manter umidade constante.',
            FinalMod = 1.1
        )
    ),
    
    ( Steering \= normal -> FinalScoreMod = ScoreMod ; FinalScoreMod = FinalMod ),

    irrigation_score(cannabis, Location, BaseScore),
    Score is round(BaseScore * FinalScoreMod),
    
    % CÁLCULO DE VOLUME POR PORCENTAGEM DO SUBSTRATO (SHOT SIZE)
    ( planting_mode(Location, pot, PotSizeL) ->
        ( Stage == seedling -> Pct = 0.01, DailyFreq = 2, FreqMsg = '1-2x'
        ; Stage == vegetative -> Pct = 0.03, DailyFreq = 5, FreqMsg = '3-6x'
        ; Stage == blooming -> Pct = 0.06, DailyFreq = 6, FreqMsg = '4-9x'
        ),
        ShotSizeL is PotSizeL * Pct,
        ShotSizeML is ShotSizeL * 1000,
        TotalDailyVolumeL is ShotSizeL * DailyFreq,
        
        VolumeL = TotalDailyVolumeL,
        format(atom(Advice), '~w (Shot: ~0f mL. Freq: ~w/dia)', [AdviceBase, ShotSizeML, FreqMsg])
    ;
        % Fallback para Campo (L/m2)
        suggest_volume_for_score(cannabis, Location, Score, VolumeL),
        Advice = AdviceBase
    ).
