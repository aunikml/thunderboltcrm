from rest_framework import serializers
from .models import Program, SubCourse

class SubCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCourse
        fields = ['id', 'name', 'description']

class ProgramSerializer(serializers.ModelSerializer):
    modules = SubCourseSerializer(many=True, required=False)

    class Meta:
        model = Program
        fields = '__all__'

    def create(self, validated_data):
        modules_data = validated_data.pop('modules', [])
        program = Program.objects.create(**validated_data)
        for module_data in modules_data:
            SubCourse.objects.create(program=program, **module_data)
        return program

    def update(self, instance, validated_data):
        modules_data = validated_data.pop('modules', None)
        # Update Program fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update modules if provided
        if modules_data is not None:
            instance.modules.all().delete()
            for module_data in modules_data:
                SubCourse.objects.create(program=instance, **module_data)
        
        return instance