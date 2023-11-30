import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from 'tailwindcss/colors';

interface Props {
    checked?: boolean;
}

export function Checkbox({checked = false}: Props){
    return(
        <TouchableOpacity
            activeOpacity={0.7}
            className='flex-row mb-2 items-center'
        >
            {
                checked
                    ?
                    <View className='h-8 w-8 bg-green-500 rounded-lg  items-center justify-center'>
                        <Feather
                            name="check"
                            size={20}
                            color={colors.white}
                        />
                    </View>
                    :
                    <View className="h-8 w-8 bg-zinc-900 rounded-lg" />
            }
            </TouchableOpacity>
    );
}