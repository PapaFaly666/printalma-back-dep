-- Ajouter la contrainte d'unicité sur shop_name
-- Vérifier d'abord si la contrainte existe déjà
DO $$
BEGIN
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'User_shop_name_key' 
        AND table_name = 'User'
    ) THEN
        -- Ajouter la contrainte d'unicité
        ALTER TABLE "User" ADD CONSTRAINT "User_shop_name_key" UNIQUE ("shop_name");
        RAISE NOTICE 'Contrainte d''unicité ajoutée sur shop_name';
    ELSE
        RAISE NOTICE 'La contrainte d''unicité existe déjà sur shop_name';
    END IF;
END $$; 