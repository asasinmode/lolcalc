from xxhash import xxh3_64_intdigest, xxh64_intdigest

def key_to_hash(key, bits=64, rsthash_version=1415):
    if isinstance(key, str):
        if rsthash_version >= 1415:
            key = xxh3_64_intdigest(key.lower())
        else:
            key = xxh64_intdigest(key.lower())
    return key & ((1 << bits) - 1)

print(hex(key_to_hash('Spell_KalistaP_Tooltip_1', 64)))
print(hex(key_to_hash('Spell_HeightenedLearning_Tooltip_1', 64)))
